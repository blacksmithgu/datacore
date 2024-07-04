import { Datacore } from "index/datacore";
import { PropsWithChildren, useEffect, useState } from "preact/compat";
import { useIndexUpdates } from "./hooks";
import { Literal } from "expression/literal";
import { VNode, createElement, isValidElement } from "preact";
import { ErrorMessage, Lit } from "./markdown";

import "./errors.css";

function LoadingProgress({ datacore }: { datacore: Datacore }) {
    useIndexUpdates(datacore, { debounce: 250 });

    return (
        <p>
            {datacore.initializer?.initialized ?? 0} / {datacore.initializer?.targetTotal ?? 0}
        </p>
    );
}

/** Loading boundary which shows a loading screen while Datacore is initializing. */
export function LoadingBoundary({ children, datacore }: PropsWithChildren<{ datacore: Datacore }>) {
    const [initialized, setInitialized] = useState(datacore.initialized);

    // Syncs the boundary with datacore's initialization state.
    // TODO: Add an event to datacore which indicates when a reindex happens (i.e., initialized
    // returns back to 'false').
    useEffect(() => {
        if (initialized) return;

        const ref = datacore.on("initialized", () => setInitialized(true));
        return () => datacore.offref(ref);
    }, [initialized, datacore]);

    if (initialized) {
        return <>{children}</>;
    } else {
        return (
            <div className="datacore-loading-boundary">
                <h4 className="datacore-loading-title">Datacore is getting ready...</h4>
                <div className="datacore-loading-content">
                    <LoadingProgress datacore={datacore} />
                </div>
            </div>
        );
    }
}

/**
 * Executes a vanilla javasript function lazily one time. Mainly useful to only run a script
 * once the parent loading boundary is actually ready.
 */
export function ScriptContainer({
    executor,
    sourcePath,
}: {
    executor: () => Promise<Literal | VNode | Function>;
    sourcePath: string;
}) {
    const [element, setElement] = useState<JSX.Element | undefined>(undefined);
    const [error, setError] = useState<Error | undefined>(undefined);

    useEffect(() => {
        setElement(undefined);
        setError(undefined);

        executor()
            .then((result) => setElement(makeRenderableElement(result, sourcePath)))
            .catch((error) => setError(error));
    }, [executor]);

    // Propogate error upwards.
    if (error) {
        throw error;
    }

    return <>{element ?? <ErrorMessage message="< View is rendering >" />}</>;
}

/** Make a renderable element from the returned object; if this transformation is not possible, throw an exception. */
export function makeRenderableElement(object: any, sourcePath: string): JSX.Element {
    if (typeof object === "function") {
        return createElement(object, {});
    } else if (Array.isArray(object)) {
        return createElement(
            "div",
            {},
            (object as any[]).map((x) => makeRenderableElement(x, sourcePath))
        );
    } else if (isValidElement(object)) {
        return object;
    } else {
        return <Lit value={object} sourcePath={sourcePath} />;
    }
}
