import React from "react";
import clsx from "clsx";
import ErrorBoundary from "@docusaurus/ErrorBoundary";
import { PageMetadata, SkipToContentFallbackId, ThemeClassNames } from "@docusaurus/theme-common";
import { useKeyboardNavigation } from "@docusaurus/theme-common/internal";
import SkipToContent from "@theme/SkipToContent";
import AnnouncementBar from "@theme/AnnouncementBar";
import Navbar from "@theme/Navbar";
import Footer from "@theme/Footer";
import LayoutProvider from "@theme/Layout/Provider";
import ErrorPageContent from "@theme/ErrorPageContent";
import type { Props } from "@theme/Layout";
import styles from "./styles.module.css";
import EternalSidebar from "@site/src/components/eternal-sidebar";
import { DocsVersionProvider } from "@docusaurus/plugin-content-docs/client";
import useGlobalData from "@docusaurus/useGlobalData";
export const PLUGIN_ID = "docusaurus-plugin-content-docs";

export default function Layout(props: Props): JSX.Element {
    const {
        children,
        noFooter,
        wrapperClassName,
        // Not really layout-related, but kept for convenience/retro-compatibility
        title,
        description,
    } = props;

    useKeyboardNavigation();
    const globalData = useGlobalData();
    const data = globalData[PLUGIN_ID].default as any;

    return (
        <LayoutProvider>
            <PageMetadata title={title} description={description} />

            <SkipToContent />

            <AnnouncementBar />

            <Navbar />
            <div style={{ display: "flex" }}>
                <div className="eternal-sidebar">
                    <DocsVersionProvider version={data.fullVersions[data.fullVersions.length - 1]}>
                        <EternalSidebar />
                    </DocsVersionProvider>
                </div>
                <div
                    id={SkipToContentFallbackId}
                    className={clsx(ThemeClassNames.wrapper.main, styles.mainWrapper, wrapperClassName)}
                >
                    <ErrorBoundary fallback={(params) => <ErrorPageContent {...params} />}>{children}</ErrorBoundary>
                </div>
            </div>

            {!noFooter && <Footer />}
        </LayoutProvider>
    );
}
