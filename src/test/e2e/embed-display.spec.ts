import { test } from "obsidian-testing-framework";
import { beforeAll, blockLang } from "../e2e-common";
import { beforeEach } from "vitest";
beforeEach(({ page }) => {
    beforeAll(page, "ui/embed.md");
});
test("markdown embed displays correctly", async ({ page }) => {
    const el = (await blockLang(page))[0];
    await el.screenshot({
        path: "./test-results/embed.png",
        type: "png",
    });
});
