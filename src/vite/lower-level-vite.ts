/**
 * Lower-level Vite API - Raw Building Blocks
 * This gives you the fundamental components to build your own custom Vite engine
 */

// Core Plugin Container - The Heart of Vite
class PluginContainer {
    private plugins: any[] = [];
    private resolveCache = new Map<string, { id: string; external?: boolean }>();
    
    constructor(options: { plugins: any[] }) {
        this.plugins = options.plugins || [];
    }
    
    /**
     * Resolve a module ID - determines what file should be loaded
     */
    async resolveId(id: string, importer?: string): Promise<{ id: string; external?: boolean }> {
        // Check cache first
        const cacheKey = `${id}:${importer || ''}`;
        if (this.resolveCache.has(cacheKey)) {
            return this.resolveCache.get(cacheKey)!;
        }
        
        // Run through plugins
        for (const plugin of this.plugins) {
            if (plugin.resolveId) {
                try {
                    const result = await plugin.resolveId(id, importer);
                    if (result) {
                        const resolved = typeof result === 'string' ? { id: result } : result;
                        this.resolveCache.set(cacheKey, resolved);
                        return resolved;
                    }
                } catch (error) {
                    // Silent failure
                }
            }
        }
        
        // Default resolution
        const resolved = { id };
        this.resolveCache.set(cacheKey, resolved);
        return resolved;
    }
    
    /**
     * Load a module - gets the source code
     */
    async load(id: string): Promise<string | null> {
        for (const plugin of this.plugins) {
            if (plugin.load) {
                try {
                    const result = await plugin.load(id);
                    if (result) {
                        return typeof result === 'string' ? result : result.code;
                    }
                } catch (error) {
                    // Silent failure
                }
            }
        }
        return null;
    }
    
    /**
     * Transform code - converts source to final JavaScript
     */
    async transform(code: string, id: string): Promise<{ code: string; map?: any }> {
        let result = { code, map: null };
        
        for (const plugin of this.plugins) {
            if (plugin.transform) {
                try {
                    const transformed = await plugin.transform(result.code, id);
                    if (transformed) {
                        result = typeof transformed === 'string' 
                            ? { code: transformed, map: null }
                            : transformed;
                    }
                } catch (error) {
                    // Silent failure
                }
            }
        }
        
        return result;
    }
    
    /**
     * Generate bundle - final bundling step
     */
    async generateBundle(options: any): Promise<{ [fileName: string]: { code: string } }> {
        const bundle: { [fileName: string]: { code: string } } = {};
        
        for (const plugin of this.plugins) {
            if (plugin.generateBundle) {
                try {
                    await plugin.generateBundle(options, bundle);
                } catch (error) {
                    // Silent failure
                }
            }
        }
        
        return bundle;
    }
}

// Bundler - Handles final code combination
class Bundler {
    async bundle(options: {
        input: { [id: string]: string };
        plugins?: any[];
        format?: string;
    }): Promise<{ [fileName: string]: { code: string } }> {
        const result: { [fileName: string]: { code: string } } = {};
        
        // For each input file, create a bundle
        for (const [fileName, code] of Object.entries(options.input)) {
            const cleanFileName = fileName.replace(/^\//, '').replace(/\.[^.]+$/, '.js');
            
            // Wrap in module format
            let bundledCode = code;
            
            if (options.format === 'es' || !options.format) {
                // ES module format - keep as-is
                bundledCode = code;
            } else if (options.format === 'iife') {
                // IIFE format for direct browser use
                bundledCode = `
(function() {
    'use strict';
    ${code}
})();`;
            } else if (options.format === 'cjs') {
                // CommonJS format
                bundledCode = `
(function(exports, module) {
    'use strict';
    ${code}
})(typeof exports !== 'undefined' ? exports : {}, typeof module !== 'undefined' ? module : {exports: {}});`;
            }
            
            result[cleanFileName] = { code: bundledCode };
        }
        
        return result;
    }
}

// The Lower-Level dc.vite API
const lowerLevelVite = {
    /**
     * Create a raw plugin container - the heart of Vite
     * You control everything from here
     */
    async createPluginContainer(options: { plugins: any[] }): Promise<PluginContainer> {
        return new PluginContainer(options);
    },
    
    /**
     * Bundler for final code combination
     */
    bundler: new Bundler(),
    
    /**
     * Helper: Create a virtual file system for manual control
     */
    createVirtualFS(): {
        files: Map<string, string>;
        writeFile: (path: string, content: string) => void;
        readFile: (path: string) => string | null;
        exists: (path: string) => boolean;
    } {
        const files = new Map<string, string>();
        
        return {
            files,
            writeFile(path: string, content: string) {
                files.set(path, content);
            },
            readFile(path: string): string | null {
                const content = files.get(path);
                return content || null;
            },
            exists(path: string): boolean {
                return files.has(path);
            }
        };
    },
    
    /**
     * Helper: Manual compilation pipeline
     * This is what you'd use to build your own createServer equivalent
     */
    async manualCompile(options: {
        pluginContainer: PluginContainer;
        vfs: any;
        entryFile: string;
        format?: string;
    }): Promise<{ [fileName: string]: { code: string } }> {
        const { pluginContainer, vfs, entryFile, format = 'es' } = options;
        
        // Step 1: Resolve the entry file
        const resolved = await pluginContainer.resolveId(entryFile);
        
        // Step 2: Load the source code
        let sourceCode = await pluginContainer.load(resolved.id);
        if (!sourceCode) {
            sourceCode = vfs.readFile(resolved.id);
        }
        if (!sourceCode) {
            throw new Error(`Could not load: ${resolved.id}`);
        }
        
        // Step 3: Transform the code
        const transformed = await pluginContainer.transform(sourceCode, resolved.id);
        
        // Step 4: Bundle the result
        const bundled = await lowerLevelVite.bundler.bundle({
            input: { [entryFile]: transformed.code },
            format
        });
        
        return bundled;
    }
};

// Export for browser-vite-endpoint integration
export default lowerLevelVite;
export { PluginContainer, Bundler };