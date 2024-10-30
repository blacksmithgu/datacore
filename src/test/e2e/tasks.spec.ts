import { expect, Locator } from "@playwright/test";
import { MarkdownTaskItem } from "index/types/markdown";
import { test } from "obsidian-testing-framework/lib/index.js";
import { assertLinesMatch } from "obsidian-testing-framework/lib/util.js";
import { openFile, beforeAll, blockLang, sleep, NON_EMPTY } from "../e2e-common";
import { beforeEach, describe } from "vitest";
beforeEach(async ({ page }) => await beforeAll(page));
describe("tasks", { timeout: 190000 }, async () => {
    const checkboxSelector = "input.datacore.task-list-item-checkbox";
    const editableSelector = `${checkboxSelector} + div .datacore-list-item-content > span.has-texteditable`;
    const waitForText = async (el: Locator) => {
        await el.locator(editableSelector).filter({ hasText: NON_EMPTY }).first().waitFor({ state: "attached" });
    };
    const sorter = (a: MarkdownTaskItem, b: MarkdownTaskItem) =>
        a.$cleantext > b.$cleantext ? 1 : a.$cleantext < b.$cleantext ? -1 : 0;
    const query = `@task and startswith($file, "data/02 - ")`;
    test("tasks can be completed", { timeout: 60000 }, async ({ page }) => {
        await openFile(page, "ui/task.md");
        const el = (await blockLang(page))[0];
        await waitForText(el);
        const firstTask = el.locator(checkboxSelector).first();
        if (await firstTask.isChecked()) {
            console.log("already checked");
            await firstTask.click({ force: true, position: { x: 0, y: 0 } });
            await sleep(10000);
        }
        await waitForText(el);
        await firstTask.click({ force: true });
        await waitForText(el);
        await sleep(16000);
        const txt = await el.locator(editableSelector).first().innerText();
        console.log(txt);
        const tasks = await page.evaluate<MarkdownTaskItem[], string>(async (q) => {
            return window.datacore!.query(q) as MarkdownTaskItem[];
        }, query.concat(` and contains($cleantext, "${txt}")`));
        console.log(tasks);
        await sleep(7000);
        await assertLinesMatch(
            page,
            tasks[0].$file,
            tasks[0].$position.start,
            tasks[0].$position.end,
            /^[\s>]*.\s*\[x\]/im,
            false
        );
    });
    test("task fields can be edited", async ({ page }) => {
        await openFile(page, "ui/task.md");
        const el = (await blockLang(page))[0];
        await waitForText(el);
        const secondTask = el.locator(`${checkboxSelector} + div`).nth(1);
        const txt = await secondTask.locator(".datacore-list-item-content > span.has-texteditable").innerText();
        console.log(txt);
        await secondTask.locator(".datacore-field").nth(0).locator(".field-value").dblclick();
        await sleep(1000);
        const txtArea = secondTask.locator(".datacore-field").first().locator("textarea");
        await txtArea.clear();
        await txtArea.pressSequentially(`new value ${Math.floor(Math.random() * 10) + 1} !`, { delay: 20 });
        await txtArea.press("Control+Enter");
        await sleep(5000);
        const tasks = await page.evaluate<MarkdownTaskItem[], { q: string; sort: string }>(
            async ({ q, sort }) => {
                return window.datacore!.query(q).sort(eval(sort)) as MarkdownTaskItem[];
            },
            { q: query.concat(` and contains($cleantext, "${txt}")`), sort: sorter.toString() }
        ); //.sort((a, b) => (<Indexable> b).$revision! - (<Indexable> a).$revision!);
        let cur = tasks[0];
        console.log(cur.$infields);
        await assertLinesMatch(
            page,
            cur.$file,
            cur.$position.start,
            cur.$position.end,
            /.*new value \d+\s?!?.*/i,
            false
        );
        expect(/new value \d+\s?[!]?/i.test(cur.$infields["field"].value as string)).toEqual(true);
    });
});
