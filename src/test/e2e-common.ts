import { Page } from "@playwright/test";
import { doWithApp } from "obsidian-testing-framework/utils";

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

export async function openFile(page: Page, file: string) {
    await doWithApp(
        page,
        async (app, args) => {
            app.workspace.getLeaf().tabHeaderCloseEl.click();
            await new Promise((res) => setTimeout(res, 5000));
            let file = app.vault.getFileByPath(args!.file);
            console.log(file);
            if (file) {
                await app.workspace.getLeaf(false).openFile(file);
            } else {
                throw new Error("file not found?");
            }
        },
        { file }
    );
}
