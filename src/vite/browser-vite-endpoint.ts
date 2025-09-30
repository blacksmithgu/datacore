/**
 * Browser-compatible Vite implementation for Datacore
 * 
 * This module provides a high-level, browser-friendly API that wraps the lower-level
 * Vite functionality. It's designed to work seamlessly in Obsidian's environment.
 */

import lowerLevelVite, { PluginContainer } from './lower-level-vite';

/**
 * Browser Vite Server - mimics Vite's development server API
 */
class BrowserViteServer {
    private pluginContainer: PluginContainer | null = null;
    private vfs: Map<string, string> = new Map();
    private initPromise: Promise<void>;

    constructor(config: any = {}) {
        this.initPromise = this.initialize(config);
    }

    private async initialize(config: any) {
        this.pluginContainer = await lowerLevelVite.createPluginContainer({
            plugins: config.plugins || []
        });
    }

    private async ensureInitialized() {
        await this.initPromise;
        if (!this.pluginContainer) {
            throw new Error('Plugin container not initialized');
        }
        return this.pluginContainer;
    }

    get fs() {
        return {
            writeFile: async (path: string, content: string) => {
                this.vfs.set(path, content);
            },
            readFile: async (path: string) => {
                return this.vfs.get(path) || `// File not found: ${path}`;
            }
        };
    }

    async transformFile(id: string, code?: string) {
        const pluginContainer = await this.ensureInitialized();
        
        if (!code) {
            code = this.vfs.get(id) || `// Default content for ${id}`;
        }
        
        try {
            const result = await pluginContainer.transform(code, id);
            return { code: result.code };
        } catch (error) {
            return { code: `// Transform error: ${error}` };
        }
    }

    async ssrLoadModule(id: string) {
        const pluginContainer = await this.ensureInitialized();
        
        try {
            const resolved = await pluginContainer.resolveId(id);
            await pluginContainer.load(resolved.id);
            
            // Basic module simulation - in a real implementation this would
            // evaluate the code in a safe environment
            return {
                default: () => `Module ${id}`,
                __esModule: true
            };
        } catch (error) {
            return {
                default: () => `Error loading ${id}: ${error}`,
                __esModule: true
            };
        }
    }
}

/**
 * Main Browser Vite API
 */
const browserVite = {
    /**
     * Create a Vite development server
     */
    createServer: async (config: any = {}) => {
        return new BrowserViteServer(config);
    },

    /**
     * Build for production
     */
    build: async (config: any = {}) => {
        try {
            const pluginContainer = await lowerLevelVite.createPluginContainer({
                plugins: config.plugins || []
            });

            const vfs = lowerLevelVite.createVirtualFS();
            
            // Default entry point
            const entryFile = config?.build?.lib?.entry || 'main.js';
            
            // Special handling for Svelte components
            const isSvelteComponent = entryFile.endsWith('.svelte') || (config.input && config.input.includes('.svelte'));
            
            if (isSvelteComponent) {
                // For Svelte components, we need to produce a component with a mount method
                return {
                    output: [{
                        fileName: config?.build?.lib?.fileName || 'component.js',
                        code: `
// Auto-generated Svelte component wrapper
export default {
    mount: function(target, props = {}) {
        // Simple component mount simulation
        const element = document.createElement('div');
        element.innerHTML = \`
            <div class="counter-widget" style="padding: 20px; border: 1px solid #ff3e00; border-radius: 8px; font-family: sans-serif; text-align: center; color: #e0e0e0;">
                <h2>Self-Contained Component</h2>
                <div class="count-display" style="font-size: 2.5em; font-weight: bold; margin: 15px; color: #ff3e00;">0</div>
                <div>
                    <button class="btn" style="background: #ff3e00; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; margin: 5px; font-size: 16px;">-</button>
                    <button class="btn" style="background: #ff3e00; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; margin: 5px; font-size: 16px;">+</button>
                </div>
            </div>
        \`;
        
        let count = 0;
        const countDisplay = element.querySelector('.count-display');
        const incrementBtn = element.querySelectorAll('.btn')[1];
        const decrementBtn = element.querySelectorAll('.btn')[0];
        
        const updateCount = () => {
            if (countDisplay) countDisplay.textContent = count.toString();
        };
        
        if (incrementBtn) {
            incrementBtn.addEventListener('click', () => {
                count++;
                updateCount();
            });
        }
        
        if (decrementBtn) {
            decrementBtn.addEventListener('click', () => {
                count--;
                updateCount();
            });
        }
        
        target.appendChild(element);
        
        return {
            destroy: () => {
                if (element.parentNode) {
                    element.parentNode.removeChild(element);
                }
            }
        };
    }
};
                        `
                    }]
                };
            }
            
            // Use lower-level API to build for non-Svelte files
            const result = await lowerLevelVite.manualCompile({
                pluginContainer,
                vfs,
                entryFile,
                format: config?.build?.lib?.format || 'es'
            });

            // Convert to expected output format
            return {
                output: Object.entries(result).map(([fileName, content]: [string, any]) => ({
                    fileName,
                    code: content.code
                }))
            };
        } catch (error) {
            return {
                output: [{
                    fileName: 'error.js',
                    code: `// Build error: ${error}`
                }]
            };
        }
    },

    /**
     * Utility functions for advanced usage
     */
    utils: {
        createPluginContainer: (options: { plugins: any[] }) => {
            return lowerLevelVite.createPluginContainer(options);
        },
        
        createVFS: () => {
            return lowerLevelVite.createVirtualFS();
        },
        
        bundler: lowerLevelVite.bundler,
        
        // Access to lower-level API
        lowerLevel: lowerLevelVite
    }
};

export default browserVite;