/**
 * Browser-compatible Vite implementation
 * This creates a Vite development server that runs entirely in the browser
 * WITHOUT requiring external dependencies like esbuild-wasm
 */

import lowerLevelVite from './lower-level-vite';

// Simple transformer for basic JavaScript/TypeScript
class SimpleTransformer {
    transform(code: string, id: string): { code: string; map?: any } {
        // Basic TypeScript to JavaScript transformation
        if (id.endsWith('.ts') || id.endsWith('.tsx')) {
            // Remove type annotations (very basic)
            code = code
                .replace(/:\s*\w+(\[\])?/g, '') // Remove type annotations
                .replace(/interface\s+\w+\s*\{[^}]*\}/g, '') // Remove interfaces
                .replace(/type\s+\w+\s*=\s*[^;]+;/g, '') // Remove type aliases
                .replace(/export\s+type\s+/g, 'export ') // Remove type exports
                .replace(/import\s+type\s+/g, 'import '); // Remove type imports
        }
        
        // DO NOT handle Svelte files here - let plugins handle them!
        // This was the bug - built-in transformer was overriding plugins
        
        return { code };
    }
}

// Virtual filesystem for browser environment
class VirtualFileSystem {
    private files = new Map<string, string>();
    
    writeFile(path: string, content: string): void {
        this.files.set(path, content);
    }
    
    readFile(path: string): string | null {
        const content = this.files.get(path);
        return content || null;
    }
    
    exists(path: string): boolean {
        return this.files.has(path);
    }
    
    getAllFiles(): Record<string, string> {
        return Object.fromEntries(this.files.entries());
    }
}

// Plugin container for running Vite plugins
class PluginContainer {
    private plugins: any[] = [];
    private transformer = new SimpleTransformer();
    
    constructor(plugins: any[] = []) {
        this.plugins = plugins;
    }
    
    async transform(code: string, id: string): Promise<{ code: string; map?: any }> {
        let result: { code: string; map?: any } = { code, map: null };
        let wasTransformed = false;
        
        // Run through plugins FIRST - they get priority
        for (const plugin of this.plugins) {
            if (plugin.transform) {
                try {
                    const transformed = await plugin.transform(result.code, id);
                    if (transformed && transformed.code !== result.code) {
                        result = transformed;
                        wasTransformed = true;
                    }
                } catch (error) {
                    // Plugin transformation failed, continue
                }
            }
        }
        
        // Only use built-in transformer if NO plugin handled it
        if (!wasTransformed) {
            const transformed = this.transformer.transform(result.code, id);
            if (transformed.code !== code) {
                result = transformed;
            }
        }
        
        return result;
    }
    
    async load(id: string): Promise<string | null> {
        for (const plugin of this.plugins) {
            if (plugin.load) {
                try {
                    const result = await plugin.load(id);
                    if (result) {
                        return result;
                    }
                } catch (error) {
                    // Plugin load failed, continue
                }
            }
        }
        return null;
    }
}

// Browser Vite Server implementation
class BrowserViteServer {
    public fs: VirtualFileSystem;
    public pluginContainer: PluginContainer;
    public config: any;
    
    constructor(config: any = {}) {
        this.config = config;
        this.fs = new VirtualFileSystem();
        this.pluginContainer = new PluginContainer(config.plugins || []);
    }
    
    async transformFile(id: string, code?: string): Promise<{ code: string; map?: any }> {
        // Get code from filesystem if not provided
        if (!code) {
            code = this.fs.readFile(id) || undefined;
            if (!code) {
                // Try to load via plugins
                code = (await this.pluginContainer.load(id)) || undefined;
                if (!code) {
                    throw new Error(`File not found: ${id}`);
                }
            }
        }
        
        // Transform through plugin pipeline
        return await this.pluginContainer.transform(code, id);
    }
    
    async ssrLoadModule(id: string): Promise<any> {
        const transformed = await this.transformFile(id);
        
        // Create a simple module loader using Function constructor
        try {
            // Create module environment
            const exports = {};
            const module = { exports };
            const require = (id: string) => {
                // Mock require for browser environment
                return {};
            };
            
            // Execute the transformed code
            const moduleFactory = new Function('exports', 'module', 'require', transformed.code);
            moduleFactory(exports, module, require);
            
            // Return the exports
            const moduleExports = module.exports as any;
            return moduleExports.default || moduleExports;
        } catch (error) {
            throw error;
        }
    }
}

// Main browser Vite implementation
const browserVite = {
    /**
     * Create a Vite development server that runs in the browser
     */
    async createServer(config: any = {}): Promise<BrowserViteServer> {
        const server = new BrowserViteServer(config);
        return server;
    },
    
    /**
     * Build using the server instance
     */
    async build(config: any): Promise<{ output: Array<{ fileName: string; code: string }> }> {
        const server = config.server || await browserVite.createServer(config);
        const entry = config.build?.lib?.entry || config.build?.rollupOptions?.input || '/main.js';
        
        try {
            // Transform the entry file
            const result = await server.transformFile(entry);
            
            const fileName = config.build?.lib?.fileName || 
                           (typeof config.build?.lib?.fileName === 'function' 
                               ? config.build.lib.fileName('es') 
                               : 'bundle.js');
            
            return {
                output: [{
                    fileName,
                    code: result.code
                }]
            };
            
        } catch (error) {
            throw error;
        }
    },
    
    /**
     * UTILS API: Common utilities for Vite operations
     */
    utils: {
        createVirtualFS: lowerLevelVite.createVirtualFS,
        createPluginContainer: lowerLevelVite.createPluginContainer,
        bundler: lowerLevelVite.bundler
    }
};

// Export for use as ES module
export default browserVite;
export const { createServer, build } = browserVite;

// Also make available globally for CDN usage
if (typeof window !== 'undefined') {
    (window as any).BrowserVite = browserVite;
}