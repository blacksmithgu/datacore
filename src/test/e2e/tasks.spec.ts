import { expect } from "@playwright/test";
import { MarkdownTaskItem } from "index/types/markdown";
import { test } from "obsidian-testing-framework/lib/index.js";
import { assertLinesMatch } from "obsidian-testing-framework/lib/util.js";
import {
    beforeAll,
    blockLang,
    rand,
    regexEscape,
    roundtripEdit,
    sleep,
    waitForAnyFile,
    waitForText,
    query as windowQuery,
} from "../e2e-common";
import { beforeEach, describe } from "vitest";
beforeEach(async ({ page }) => beforeAll(page, "ui/task.md"));
describe("tasks", { timeout: 190000 }, async () => {
    const checkboxSelector = "input.datacore.task-list-item-checkbox";
    const editableSelector = `${checkboxSelector} + div .datacore-list-item-content > span.has-texteditable`;
    const query = `@task and startswith($file, "data/02 - ") and regexreplace($cleantext, "^\\s+|\\s+$", "") != ""`;
    test("tasks can be completed", { timeout: 60000 }, async ({ page }) => {
        const el = (await blockLang(page))[0];
        await waitForText(el, editableSelector);
        const firstTask = el.locator(checkboxSelector).first();
        if (await firstTask.isChecked()) {
            console.log("already checked");
            await firstTask.click({ force: true, position: { x: 0, y: 0 } });
            await waitForAnyFile(page);
        }
        await firstTask.click({ force: true });

        await el.locator(editableSelector).first().dblclick();
        const txt = await el.locator(editableSelector).locator("textarea").first().inputValue();
        await el.locator(editableSelector).first().dblclick();

        await waitForAnyFile(page);

        console.log("tasktext", txt);
        const tasks = await windowQuery<MarkdownTaskItem>(
            page,
            query.concat(` and contains($cleantext, "${txt.split("\n")[0]}")`)
        );
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
        const el = (await blockLang(page))[0];
        await waitForText(el, editableSelector);
        const secondTask = el.locator(`${checkboxSelector} + div`).nth(1);
        await el.locator(editableSelector).first().dblclick();
        const txt = await el.locator(editableSelector).locator("textarea").first().inputValue();
        console.log(txt);
        await secondTask.locator(".datacore-field").nth(0).locator(".field-value").dblclick();
        await waitForAnyFile(page);
        const txtArea = secondTask.locator(".datacore-field").first().locator("textarea");
        await txtArea.clear();
        await txtArea.pressSequentially(`new value ${rand(1, 10)} !`, { delay: 20 });
        await txtArea.press("Control+Enter");
        await waitForAnyFile(page);
        const tasks = await windowQuery<MarkdownTaskItem>(
            page,
            query.concat(` and contains($cleantext, "${txt.split("\n")[0]}")`)
        );
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
    test("task text can be edited", async ({ page }) => {
        const el = (await blockLang(page))[0];
        await waitForText(el, editableSelector);
        const taskRow = el.locator(editableSelector).nth(4);
        let values = await roundtripEdit(
            page,
            taskRow,
            query,
            `\nsome new text.\nthe **magic number** is ${rand(1, 10)}`,
            false
        );

        const { oldText } = values;
        await waitForAnyFile(page);

        let nrow = (await windowQuery<MarkdownTaskItem>(page, query.concat(` and $id = "${values.id}"`)))[0];
        console.log("task-ntxt", nrow.$text);
        expect(/magic number/i.test(nrow.$text!)).toEqual(true);
        console.log(nrow.$file, nrow.$position);
        await assertLinesMatch(page, nrow.$file, nrow.$position.start, nrow.$position.end, /magic number/i, false);
        values = await roundtripEdit(page, taskRow, query, oldText);
        await waitForAnyFile(page);

        nrow = (await windowQuery<MarkdownTaskItem>(page, query.concat(` and $id = "${values.id}"`)))[0];
        console.log("task-ntxt2", nrow.$text);
        expect(nrow.$text?.includes(oldText)).toEqual(true);
        await assertLinesMatch(
            page,
            nrow.$file,
            values.pos.start,
            values.pos.end,
            new RegExp(regexEscape(oldText)),
            false
        );
    });
});
