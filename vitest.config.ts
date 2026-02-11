import path from "path";
import {defineConfig} from "vitest/config";

export default defineConfig({
	test: {
		dir: "src/test/e2e/",
		pool: "threads",
		provide: {
			vault: path.resolve(process.cwd(), "..", "public-test-vault")
		},
		hookTimeout: 60000,
		retry: 1,
		exclude: [],
		testTimeout: 120000,
		watch: !process.env.CI,
		ui: !process.env.CI,
		open: false
	}
})
