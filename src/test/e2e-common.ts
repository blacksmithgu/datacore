import { Page } from "@playwright/test";
import { doWithApp } from "obsidian-testing-framework/lib/util.js";
import { ScriptLanguage } from "utils/javascript";

export async function waitForIndexingComplete(page: Page) {
    await enablePlugin(page);
    try {
        await page.evaluate(() => {
            return new Promise((res, rej) => {
                let resolved = false;
                window.datacore?.core.on("initialized", () => {
                    res(null);
                });
                setTimeout(() => !resolved && rej("timeout"), 7500);
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
export async function beforeAll(page: Page) {
    await enablePlugin(page);
    await waitForIndexingComplete(page);
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
