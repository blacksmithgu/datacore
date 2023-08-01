import { Datacore } from "index/datacore";
import { useIndexUpdates } from "ui/hooks";
import React from "react";

/** Render a helpful status indicator in the status bar of how the import is going. */
export function IndexStatusBar({ datacore }: { datacore: Datacore }) {
    useIndexUpdates(datacore);

    // Whenever the view updates, figure out what state we are in based on if an initializer is present.
    if (datacore.initializer) {
        return (
            <span>
                <b>Datacore:&nbsp;</b>
                Scanning {datacore.initializer.initialized} of {datacore.initializer.files}.
            </span>
        );
    } else if (datacore.importer.queue.length > 0) {
        return (
            <span>
                <b>Datacore:&nbsp;</b>
                Updating {datacore.importer.queue.length} files.
            </span>
        );
    } else {
        return (
            <span>
                <b>Datacore:&nbsp;</b> Ready
            </span>
        );
    }
}
