import path from "path";
import {defineConfig} from "vitest/config";

export default defineConfig({
	test: {
		dir: "src/test/e2e/",
		pool: "threads",
		poolOptions: {
			threads: {
				maxThreads: 1,
				minThreads: 1
			}
		},
		provide: {
			vault: path.resolve(process.cwd(), "..", "public-test-vault")
		},
		hookTimeout: 60000,
		retry: 1,
		exclude: [],
		testTimeout: 30000,
		watch: !process.env.CI,
		ui: !process.env.CI,
		open: false
	}
})
