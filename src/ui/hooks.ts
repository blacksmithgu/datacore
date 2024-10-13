/** @module ui */
import { Datacore } from "index/datacore";
import { debounce } from "obsidian";
import { IndexQuery } from "index/types/index-query";
import { Indexable } from "index/types/indexable";
import { useCallback, useEffect, useMemo, useRef, useState } from "preact/hooks";
import { SearchResult } from "index/datastore";
import { Literals } from "expression/literal";
import { Result } from "api/result";

/** Hook that updates the view whenever the revision updates, returning the newest revision.
 * @group Hooks
 */
export function useIndexUpdates(datacore: Datacore, settings?: { debounce?: number }): number {
    const [revision, setRevision] = useState(datacore.datastore.revision);
    const debouncedRevision = useMemo(() => {
        if (settings?.debounce && settings.debounce == 0) return setRevision;
        else return debounce(setRevision, settings?.debounce ?? 500);
    }, [setRevision, settings?.debounce]);

    useEffect(() => {
        const ref = datacore.on("update", debouncedRevision);
        return () => datacore.offref(ref);
    }, []);

    return revision;
}

/** A hook which updates whenever file metadata for a specific file updates. 
 * @group Hooks
*/
export function useFileMetadata(
    datacore: Datacore,
    path: string,
    settings?: { debounce?: number }
): Indexable | undefined {
    const indexRevision = useIndexUpdates(datacore, settings);

    // TODO: I think load returns consistent objects so it should be okay.
    return useMemo(() => datacore.datastore.load(path), [indexRevision, path]);
}

/** Settings which control how automatic query reloading should work. 
 * @group Config
*/
export interface UseQuerySettings {
    /**
     * If present, debounce repeated query updates so that an update only occurs every \<debounce\> milliseconds. This
     * defaults to the overall default debounce settings.
     */
    debounce?: number;
}

/** Perform a live, synchronous query which updates its results whenever the backing query would change. 
 * 
 * @group Hooks
*/
export function tryUseFullQuery(
    datacore: Datacore,
    query: IndexQuery,
    settings?: UseQuerySettings
): Result<SearchResult<Indexable>, string> {
    // Track index updates with customizable debouncing.
    const indexRevision = useIndexUpdates(datacore, settings);

    // We "intern" the query, meaning we reuse the oldest version if it is semantically equal but just a different object.
    const internedQuery = useInterning(query, Literals.equals);
    // Intern the output as well so react diffing "just works" with the result of useQuery.
    const internedResult = useRef<Result<SearchResult<Indexable>, string> | undefined>(undefined);

    // On every index revision update, re-run the query and check if it produced meaningfully new values.
    return useMemo(() => {
        const newResult = datacore.datastore.search(query);

        // Set failure if the new request is a failure.
        if (!newResult.successful) {
            internedResult.current = Result.failure(newResult.error);
            return internedResult.current;
        }

        // If there is no current interned state, update it and return.
        if (internedResult.current === undefined) {
            internedResult.current = Result.success(newResult.value);
            return internedResult.current;
        }

        // At this point, the new request is is successful and the old result is defined. If the old result was an error, update it.
        const oldResult = internedResult.current;
        if (!oldResult.successful) {
            internedResult.current = Result.success(newResult.value);
            return internedResult.current;
        }

        // Both are successful, check if they are different.
        if (
            oldResult.value.revision != newResult.value.revision ||
            !sameObjects(oldResult.value.results, newResult.value.results)
        ) {
            return (internedResult.current = Result.success(newResult.value));
        }

        // Same revision and same objects, this is the same query result, so return the old object.
        return internedResult.current;
    }, [internedQuery, indexRevision]);
}

/** Perform a live, synchronous query which updates its results whenever the backing query would change. 
 * 
 * @group Hooks
*/
export function useFullQuery(
    datacore: Datacore,
    query: IndexQuery,
    settings?: UseQuerySettings
): SearchResult<Indexable> {
    return tryUseFullQuery(datacore, query, settings).orElseThrow((e) => "Failed to search: " + e);
}

/** Simplier version of useFullQuery which just directly returns results. 
 * 
 * @group Hooks
*/
export function tryUseQuery(
    datacore: Datacore,
    query: IndexQuery,
    settings?: UseQuerySettings
): Result<Indexable[], string> {
    return tryUseFullQuery(datacore, query, settings).map((result) => result.results);
}

/** Simplier version of useFullQuery which just directly returns results. 
 * 
 * @group Hooks
*/
export function useQuery(datacore: Datacore, query: IndexQuery, settings?: UseQuerySettings): Indexable[] {
    return useFullQuery(datacore, query, settings).results;
}

/** Determines if the two sets of objects are the same. Only uses revision comparison for performance.
 * 
 * @hidden
 */
function sameObjects(old: Indexable[], incoming: Indexable[]) {
    if (old.length != incoming.length) return false;

    const olds: Record<string, number> = {};
    for (const indexable of old) {
        olds[indexable.$id] = indexable.$revision!;
    }

    for (const indexable of incoming) {
        const value = olds[indexable.$id];
        if (value == undefined) return false;
        if (value != indexable.$revision) return false;
    }

    return true;
}

/**
 * "Interns" the incoming value, returning the oldest equal instance. This is a trick to improve React diffing
 *  behavior, as two objects which are equals via equality(a, b) will return the same object reference after being
 *  interned.
 * 
 * @group Hooks
 */
export function useInterning<T>(value: T, equality: (a: T, b: T) => boolean): T {
    const ref = useRef<T>();

    if (ref.current === undefined || !equality(ref.current, value)) {
        ref.current = value;
    }

    return ref.current;
}

/** Use a stable callback which hides mutable state behind a stable reference. 
 * 
 * @group Hooks
*/
export function useStableCallback<T>(callback: T, deps: any[]): T {
    const ref = useRef<T>();

    useEffect(() => {
        ref.current = callback;
    }, [callback, ...deps]);

    return useCallback(
        (...args: any[]) => {
            (ref.current as any)(...args);
        },
        [ref]
    ) as T;
}

const NO_OP_UPDATE = (x: any) => {};

/** Use state that will default to an external controlled value if set; otherwise, will track an internal value. 
 * 
 * @group Hooks
*/
export function useControlledState<T>(
    initialState: T,
    override?: T,
    update?: (value: T) => void
): [T, (value: T) => void] {
    const [state, setState] = useState(override ?? initialState);
    if (override !== undefined) {
        if (state != override) setState(override);

        return [override, update ?? NO_OP_UPDATE];
    }

    const setStateWithUpdate = useCallback(
        (value: T) => {
            setState(value);
            if (update) update(value);
        },
        [setState, update]
    );

    return [state, setStateWithUpdate];
}
