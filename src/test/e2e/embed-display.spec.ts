import { test } from "obsidian-testing-framework";
import { beforeAll, blockLang } from "../e2e-common";
test.beforeEach(async ({ page }) => {
	console.log("beforeEach", page);
    await beforeAll(page, "ui/embed.md");
});
test("markdown embed displays correctly", async ({ page }) => {
    const el = (await blockLang(page))[0];
    await el.screenshot({
        path: "./test-results/embed.png",
        type: "png",
    });
});
