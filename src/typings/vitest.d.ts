import { ObsidianTestFixtures } from "obsidian-testing-framework/lib/fixtures";
declare module "vitest" {
    export interface TestContext extends ObsidianTestFixtures {}
}
