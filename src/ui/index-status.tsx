import { Datacore } from "index/datacore";
import { useIndexUpdates } from "ui/hooks";

/** Render a helpful status indicator in the status bar of how the import is going. */
export function IndexStatusBar({ datacore }: { datacore: Datacore }) {
    useIndexUpdates(datacore, { debounce: 250 });

    // Whenever the view updates, figure out what state we are in based on if an initializer is present.
    if (datacore.initializer) {
        return (
            <span>
                Scanning {datacore.initializer.initialized} of {datacore.initializer.files} files
            </span>
        );
    } else if (datacore.importer.queue.size() > 0) {
        return <span>Updating {datacore.importer.queue.size()} files</span>;
    } else {
        return <span>{datacore.datastore.size} objects</span>;
    }
}
