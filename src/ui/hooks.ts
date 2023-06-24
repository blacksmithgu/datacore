import { Datacore } from "index/datacore";
import { useEffect, useState } from "preact/hooks";

/** Hook that updates the view whenever the revision updates, returning the newest revision. */
export function useIndexUpdates(datacore: Datacore): number {
    const [revision, setRevision] = useState(datacore.datastore.revision);

    useEffect(() => {
        const ref = datacore.on("update", (rev) => setRevision(rev));
        return () => datacore.offref(ref);
    }, []);

    return revision;
}
