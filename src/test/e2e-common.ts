import { Locator, Page } from "@playwright/test";
import { Indexable } from "index/types/indexable";
import { LineSpan } from "index/types/json/markdown";
import { doWithApp } from "obsidian-testing-framework/lib/util.js";
import { ScriptLanguage } from "utils/javascript";

export async function waitForIndexingComplete(page: Page) {
    await enablePlugin(page);
    try {
        await page.evaluate(() => {
            return new Promise((res, rej) => {
                let resolved = false;
                window.datacore?.core.on("initialized", () => {
                    resolved = true;
                    res(null);
                });
                setTimeout(() => !resolved && rej("timeout"), 7500);
            });
        });
    } catch (e) {
        console.error(e);
    }
}
export async function waitForAnyFile(page: Page) {
    try {
        await page.evaluate(async () => {
            return await new Promise((res, rej) => {
                window.app.vault.on("modify", (f) => {
                    console.log("change", f.path);
                    res(null);
                });
                setTimeout(() => rej("timeout"), 20000);
            });
        });
    } catch (e) {
        console.error(e);
    }
}
async function enablePlugin(page: Page) {
    return await doWithApp(page, async (app) => {
        await app.plugins.enablePlugin("datacore");
    });
}

export async function openFile(page: Page, file: string, close: boolean = false) {
    await doWithApp(
        page,
        async (app, args) => {
            /* args!.close && */ app.workspace.getLeaf().tabHeaderCloseEl.click();
            await sleep(5000);
            let file = app.vault.getFileByPath(args!.file);
            if (file) {
                await app.workspace.getLeaf(false).openFile(file, { state: { mode: "preview" } });
            } else {
                throw new Error("file not found?");
            }
        },
        { file, close }
    );
}
export async function beforeAll(page: Page, toOpen: string) {
    await enablePlugin(page);
    await waitForIndexingComplete(page);
    await openFile(page, toOpen);
}
export async function blockLang(page: Page, dialect: ScriptLanguage = "jsx") {
    let className = `.el-pre > .block-language-datacore${dialect}`;
    try {
        await page.locator(className).waitFor({ timeout: 7000 });
    } catch (e) {
        console.warn("timed out waiting for codeblock to appear. this could be because it's already visible.");
    }
    return await page.locator(className).all();
}
export function sleep(ms: number) {
    return new Promise((res) => setTimeout(res, ms));
}
export const NON_EMPTY = /[^\s\n\r]+/gim;
export async function waitForText(el: Locator, selector: string) {
    await el.locator(selector).filter({ hasText: NON_EMPTY }).first().waitFor({ state: "attached" });
}
export async function query<T>(page: Page, q: string) {
    return await page.evaluate<T[], string>(async (q) => {
        return window.datacore!.query(q) as T[];
    }, q);
}
export function regexEscape(str: string): string {
    const s = JSON.stringify(str).replace(/^"|"$/mg, "").replace(/([\[\]{}.+\^\$\|\\()*?])/g, "\\$1");
		console.log("escaped", s)
		return s;
}

export async function roundtripEdit<T extends Indexable & { $position: LineSpan }>(
    page: Page,
    loc: Locator,
    baseQuery: string,
    newValue: string,
    clear: boolean = true
) {
    await loc.dblclick();
    const textArea = loc.locator("textarea").first();
    const txt = await textArea.inputValue();
    console.log("textarea", txt);
    const qr = await query<T>(page, baseQuery.concat(` and contains($cleantext, "${txt.split("\n")[0]}")`));
    console.log("Tasks", qr[0], qr.length);
    const { $id: id, $position: pos } = qr[0];

    clear && (await textArea.clear());
    !clear && (await textArea.press("PageDown"));
    !clear && (await textArea.press("End"));
    let split = newValue.split("\n");
    for (let i = 0; i < split.length; i++) {
        await textArea.pressSequentially(split[i], { delay: 75 });
        if (i < split.length - 1 && newValue.includes("\n")) await textArea.press("Enter");
    }
    await textArea.press("Control+Enter");
    await sleep(5000);
    return { id, pos, oldText: txt };
}

export function rand(min: number, max: number) {
    return Math.floor(Math.random() * max) + min;
}
