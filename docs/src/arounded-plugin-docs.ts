import docsPlugin from "@docusaurus/plugin-content-docs";
import { around } from "monkey-around";
import { normalizeUrl } from "@docusaurus/utils";
import { toFullVersion } from "@docusaurus/plugin-content-docs/lib/versions/index.js";
import { toGlobalDataVersion } from "@docusaurus/plugin-content-docs/lib/globalData.js";

const aroundWrapper = { docsPlugin };

const uninstalled = around(aroundWrapper, {
    docsPlugin(oldMethod) {
        return async function (ctx, opts) {
            let oldVal = await oldMethod.apply(this, [ctx, opts]);
            let innerMonkey = around(oldVal, {
                contentLoaded(next) {
                    return async function ({ content, actions }) {
                        const { loadedVersions } = content;
                        const versions = loadedVersions.map(toFullVersion);
                        await next.apply(this, [{ content, actions }]);
                        const path = normalizeUrl([ctx.baseUrl, opts.routeBasePath]);
                        actions.setGlobalData({
                            path,
                            fullVersions: versions,
                            versions: versions.map(toGlobalDataVersion),
                            breadcrumbs: opts.breadcrumbs,
                        });
                    };
                },
            });
            return oldVal;
        };
    },
});
export default aroundWrapper.docsPlugin;
