import { test } from "obsidian-testing-framework";
import { expect } from "@playwright/test";
import { openFile, waitForIndexingComplete } from "test/e2e-common";

test("state updates on button click", async ({ page }) => {
    await waitForIndexingComplete(page);
    await openFile(page, "ui/buttons.md");
    await page.press("div.cm-content", "PageDown");
    await page.locator(".block-language-datacorejsx").waitFor();
    const el = (await page.locator(".block-language-datacorejsx").all())[0];
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
