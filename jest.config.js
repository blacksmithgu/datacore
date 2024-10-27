/** 
 * @type {import('jest').Config}
 */
export default {
    preset: "ts-jest",
    testEnvironment: "jsdom",
    moduleDirectories: ["node_modules", "src"],
		testPathIgnorePatterns: ["src/test/e2e/.*"]	
};
