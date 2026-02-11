import { beforeEach } from "vitest";
import { test } from "obsidian-testing-framework";
import type {ObsidianTestFixtures} from "obsidian-testing-framework/fixture";
import { expect } from "@playwright/test";
import { beforeAll, blockLang } from "../e2e-common";
beforeEach<ObsidianTestFixtures>(({ page }) => beforeAll(page, "ui/buttons.md"));
test("state updates on button click", async ({ page }) => {
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
