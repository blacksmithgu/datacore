/**
 * Vite entry point for Datacore
 * This file creates a library of pre-built components that can be imported 
 * into regular datacorejsx blocks
 */

import { h } from 'preact';
import { DatacoreLocalApi } from './api/local-api';
import browserVite from './vite/browser-vite-endpoint';

// Create the BasicView component to match the JSX example
export const BasicView = ({ dc, title = "VITE COMPONENT WORKS!" }: { dc?: DatacoreLocalApi; title?: string }) => {
    return h('div', {
        style: {
            height: "60vh",
            width: "100%",
            padding: "10px",
            border: "2px solid white",
            borderRadius: "8px",
        }
    }, [
        h('h2', {}, title)
    ]);
};

// Create a library object that can be imported
const ViteComponents = {
    BasicView
};

// Export the browser Vite implementation
export { browserVite };

// Export both named and default for flexibility
export default ViteComponents;

// Also make it available globally for easy access in JSX blocks
if (typeof window !== 'undefined') {
    (window as any).ViteComponents = ViteComponents;
    (window as any).BrowserVite = browserVite;
}