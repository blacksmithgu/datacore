import path from "path";
import {defineConfig} from "vitest/config";

export default defineConfig({
	test: {
		dir: "src/test/e2e/",
		pool: "forks",
		sequence: {
			hooks: "list",
			setupFiles: "list",
		},
		globalSetup: ["./src/test/e2e/__setup.ts"],
		provide: {
			vault: path.resolve(process.cwd(), "test-vault")
		},
		hookTimeout: 60000,
		retry: 5,
		fileParallelism: true,
		maxWorkers: 4,
		isolate: false,

		exclude: [],
		testTimeout: 120000,
		watch: !process.env.CI,
		ui: !process.env.CI,
		open: false
	}
})
