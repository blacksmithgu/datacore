import { test } from "obsidian-testing-framework";
import { openFile, beforeAll, blockLang } from "../e2e-common";
import { beforeEach } from "vitest";
beforeEach(({ page }) => {
    beforeAll(page);
});
test("markdown embed displays correctly", async ({ page }) => {
    await openFile(page, "ui/embed.md");
    const el = (await blockLang(page))[0];
    await el.screenshot({
        path: "./test-results/embed.png",
        type: "png",
    });
});
