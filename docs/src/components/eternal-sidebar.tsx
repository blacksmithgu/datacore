import { useLocation } from "@docusaurus/router";
import useGlobalData from "@docusaurus/useGlobalData";
import DocSidebar from "../theme/DocSidebar";
import { DocsSidebarProvider , useActiveDocContext } from "@docusaurus/plugin-content-docs/client";
import { PropSidebar } from "@docusaurus/plugin-content-docs";
import routes from "@generated/routes";
import { PLUGIN_ID } from "../theme/Layout";
import { toSidebarsProp } from "../util";

export default function EternalSidebar() {
	const globalData = useGlobalData();
	const loc = useLocation();
	console.log("gd", globalData);
	const data = globalData[PLUGIN_ID].default as any;
	const {activeDoc} = useActiveDocContext("default");
	const idx = data.fullVersions.length - 1;
	const sname = activeDoc?.sidebar ?? "global"
	return (
		<DocsSidebarProvider name="global" items={data.fullVersions[idx].sidebars.global as PropSidebar}>
			<DocSidebar path={loc.pathname} isHidden={false} sidebar={toSidebarsProp(data.fullVersions[idx]).global} onCollapse={() => {}}/>
		</DocsSidebarProvider>
	)
}