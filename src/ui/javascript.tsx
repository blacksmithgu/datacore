import { ErrorMessage, SimpleErrorBoundary, CURRENT_FILE_CONTEXT, DatacoreContextProvider } from "ui/markdown";
import { App, MarkdownRenderChild } from "obsidian";
import { DatacoreLocalApi } from "api/local-api";
import { h, render, Fragment, VNode } from "preact";
import { unmountComponentAtNode } from "preact/compat";
import { ScriptLanguage, asyncEvalInContext, transpile } from "utils/javascript";
import { LoadingBoundary, ScriptContainer } from "./loading-boundary";
import { Datacore } from "index/datacore";
import { Literal } from "expression/literal";

/**
 * Renders a script by executing it and handing it the appropriate React context to execute
 * automatically.
 */
export class DatacoreJSRenderer extends MarkdownRenderChild {
    private loaded: boolean = false;

    public constructor(
        public api: DatacoreLocalApi,
        public container: HTMLElement,
        public path: string,
        public script: string,
        public language: ScriptLanguage
    ) {
        super(container);
    }

    public async onload() {
        this.loaded = true;

        // Attempt to parse and evaluate the script to produce either a renderable JSX object or a function.
        try {
            const primitiveScript = await transpile(this.path, this.script, this.language);
            const renderer = async () => {
                return (await asyncEvalInContext(primitiveScript, {
                    dc: this.api,
                    h: h,
                    Fragment: Fragment,
                })) as Promise<Literal | VNode | Function>;
            };

            this.renderScript(renderer);

            // If the path ever changes, update the context provider and re-render.
            this.registerEvent(
                this.api.core.on("rename", (newPath, oldPath) => {
                    if (oldPath === this.path) {
                        this.path = this.api.path = newPath;
                        this.renderScript(renderer);
                    }
                })
            );
        } catch (ex) {
            render(
                <ErrorMessage message="Datacore failed to render the code block." error={"" + ex} />,
                this.container
            );
        }
    }

    /** Lazily renders a script, catching errors automatically. */
    private renderScript(renderer: () => Promise<Literal | VNode | Function>) {
        render(
            <DatacoreContextProvider
                app={this.api.app}
                component={this}
                datacore={this.api.core}
                settings={this.api.core.settings}
            >
                <CURRENT_FILE_CONTEXT.Provider value={this.path}>
                    <SimpleErrorBoundary message="The datacore script failed to execute.">
                        <LoadingBoundary datacore={this.api.core}>
                            <ScriptContainer executor={renderer} sourcePath={this.path} />
                        </LoadingBoundary>
                    </SimpleErrorBoundary>
                </CURRENT_FILE_CONTEXT.Provider>
            </DatacoreContextProvider>,
            this.container
        );
    }

    public onunload(): void {
        if (this.loaded) unmountComponentAtNode(this.container);
        this.loaded = false;
    }
}

/** A trivial wrapper which allows a react component to live for the duration of a `MarkdownRenderChild`. */
export class ReactRenderer extends MarkdownRenderChild {
    public constructor(
        public app: App,
        public datacore: Datacore,
        public container: HTMLElement,
        public sourcePath: string,
        public element: VNode
    ) {
        super(container);
    }

    public onload(): void {
        this.renderElement();

        // If the path ever changes, update the context provider and re-render.
        this.registerEvent(
            this.datacore.on("rename", (newPath, oldPath) => {
                if (oldPath === this.sourcePath) {
                    this.sourcePath = newPath;
                    this.renderElement();
                }
            })
        );
    }

    /** Render the given element. */
    private renderElement(): void {
        render(
            <DatacoreContextProvider
                app={this.app}
                component={this}
                datacore={this.datacore}
                settings={this.datacore.settings}
            >
                <CURRENT_FILE_CONTEXT.Provider value={this.sourcePath}>
                    <LoadingBoundary datacore={this.datacore}>{this.element}</LoadingBoundary>
                </CURRENT_FILE_CONTEXT.Provider>
            </DatacoreContextProvider>,
            this.container
        );
    }

    public onunload(): void {
        unmountComponentAtNode(this.container);
    }
}
