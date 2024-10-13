import { themes as prismThemes } from "prism-react-renderer";
import type { Config } from "@docusaurus/types";
import type * as Preset from "@docusaurus/preset-classic";
import searchLocal from "@easyops-cn/docusaurus-search-local";
import arounded from "./src/arounded-plugin-docs";
// import typedocConfig from "./typedoc.json";

const config: Config = {
    title: "Datacore",
    favicon: "img/favicon.ico",
    // Set the production url of your site here
    url: "https://blacksmithgu.github.io",
    // Set the /<baseUrl>/ pathname under which your site is served
    // For GitHub pages deployment, it is often '/<projectName>/'
    baseUrl: "/datacore",

    // GitHub pages deployment config.
    // If you aren't using GitHub pages, you don't need these.
    organizationName: "blacksmithgu", // Usually your GitHub org/user name.
    projectName: "datacore", // Usually your repo name.

    onBrokenLinks: "throw",
    onBrokenMarkdownLinks: "warn",

    // Even if you don't use internationalization, you can use this field to set
    // useful metadata like html lang. For example, if your site is Chinese, you
    // may want to replace "en" with "zh-Hans".
    i18n: {
        defaultLocale: "en",
        locales: ["en"],
    },

    presets: [
        /*         [
            "classic",
            {
                blog: false,
                theme: {
                    customCss: "./src/css/custom.css",
                },
            },
        ], */
    ],

    themeConfig: {
        // Replace with your project's social card
        navbar: {
            title: "Datacore",
            logo: {
                srcDark: "img/logo.svg",
                src: "img/logo-light.svg",
            },
            items: [
                {
                    type: "docSidebar",
                    sidebarId: "global",
                    position: "left",
                    label: "Explore",
                },
                {
                    position: "right",
                    html: `<div style="display: flex; align-items: center">
									<svg style="height: min-content;" xmlns="http://www.w3.org/2000/svg" class="github-logo" width="16" height="16" viewBox="0 0 448 512"><!--! Font Awesome Free 6.5.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free (Icons: CC BY 4.0, Fonts: SIL OFL 1.1, Code: MIT License) Copyright 2024 Fonticons, Inc.--><path d="M439.55 236.05 244 40.45a28.87 28.87 0 0 0-40.81 0l-40.66 40.63 51.52 51.52c27.06-9.14 52.68 16.77 43.39 43.68l49.66 49.66c34.23-11.8 61.18 31 35.47 56.69-26.49 26.49-70.21-2.87-56-37.34L240.22 199v121.85c25.3 12.54 22.26 41.85 9.08 55a34.34 34.34 0 0 1-48.55 0c-17.57-17.6-11.07-46.91 11.25-56v-123c-20.8-8.51-24.6-30.74-18.64-45L142.57 101 8.45 235.14a28.86 28.86 0 0 0 0 40.81l195.61 195.6a28.86 28.86 0 0 0 40.8 0l194.69-194.69a28.86 28.86 0 0 0 0-40.81z"></path></svg>
										<div style="margin-left: 0.5em">View on Github</div>
									</div>`,
                    href: "https://github.com/blacksmithgu/datacore",
                },
            ],
        },
        footer: {
            style: "dark",
            links: [
                {
                    title: "Community",
                    items: [
                        {
                            label: "Discord",
                            href: "https://discord.gg/KwZUX4BYba",
                        },
                    ],
                },
            ],
            copyright: `Copyright © ${new Date().getFullYear()}. Built with Docusaurus. 🦖`,
        },
        prism: {
            theme: prismThemes.shadesOfPurple,
            darkTheme: prismThemes.dracula,
        },
    } as Preset.ThemeConfig,
    themes: [
        [
            "@docusaurus/theme-classic",
            {
                customCss: "./src/css/custom.css",
            },
        ],
        [
            "@easyops-cn/docusaurus-search-local",
            {
                hashed: true,
                language: ["en"],
                docsDir: "./root",
            },
        ],
    ],
    plugins: [
        "@docusaurus/plugin-debug",
        [
            arounded,
            {
                sidebarPath: "./sidebars.ts",
                path: "./root",
								
                // Please change this to your repo.
                // Remove this to remove the "edit this page" links.
                editUrl: "https://github.com/blacksmithgu/datacore/tree/main/docs",
                id: "default",
            },
        ],
        [
            "docusaurus-plugin-typedoc",
            // Options
            {
                plugin: ["typedoc-plugin-merge-modules", "typedoc-plugin-markdown"],
                mergeModulesRenameDefaults: true,
                mergeModulesMergeMode: "module",
                watch: process.env.WATCH_DOCS == "true",
                // entryPoints: [".."],
                tsconfig: "../tsconfig.json",
                out: "./root/api",
                mergeReadme: true,
                // ...typedocConfig,
                skipErrorChecking: true,
                excludeExternals: true,
                entryPointStrategy: "expand",
                readme: "./javascript.md",
                name: "Javascript/Typescript API",

                excludeInternal: true,
                groupOrder: ["Components", "Hooks", "Common Types", "Other"],
                excludeNotDocumented: true,
                externalPattern: ["**/node_modules/**", "../**/node_modules/**", "**/react-select/**"],
                expandParameters: true,
                outputFileStrategy: "members",
                membersWithOwnFile: ["Function", "Class", "Interface", "TypeAlias"],
                defaultCategory: "Other",
                navigation: {
                    includeFolders: false,
                    includeGroups: true,
                    includeCategories: true,
                },
                categorizeByGroup: true,
                hideGroupHeadings: true,
                entryPoints: [
                    "../src/api/**/*.ts*",
                    "../src/index/types/**/*.ts",
                    "../src/ui/markdown.tsx",
                    "../src/ui/fields/**/*.ts*",
                    "../src/expression/literal.ts",
                ],
                exclude: [
                    "../src/test/**/*.*",
                    "../node_modules/react-select/dist/*.*",
                    "../src/typings",
                    "../src/api/coerce.ts",
                    "../src/api/script-cache.ts",
                    "../src/api/ui/grouping.ts",
                    "../src/index/types/json/**/*.*",
                    "../src/index/types/index-query.ts",
                ],
                preserveWatchOutput: true,
            },
        ],
    ],
};

export default config;
