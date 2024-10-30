import { test } from "obsidian-testing-framework";
import { expect } from "@playwright/test";
import { openFile, beforeAll, blockLang } from "../e2e-common";
import { beforeEach } from "vitest";
beforeEach(({ page }) => beforeAll(page));
test("state updates on button click", async ({ page }) => {
    await openFile(page, "ui/buttons.md");
    const el = (await blockLang(page))[0];
    const btn = el.locator("button").first();
    expect(btn).toHaveText(/click me/i);
    await btn.click();
    await btn.click();
    await btn.click();
    const count = el.getByTestId("button-outer");
    expect(count).toHaveText(/count is: 3/i);
    await el.screenshot({
        path: "./test-results/result.png",
        type: "png",
    });
});
