/** A promise that can be resolved directly. */
export type Deferred<T> = Promise<T> & {
    resolve: (value: T) => void;
    reject: (error: unknown) => void;
};

/** Create a new deferred object, which is a resolvable promise. */
export function deferred<T>(): Deferred<T> {
    let resolve: (value: T) => void;
    let reject: (error: unknown) => void;

    const promise = new Promise((res, rej) => {
        resolve = res;
        reject = rej;
    });

    const deferred = promise as Deferred<T>;
    deferred.resolve = resolve!;
    deferred.reject = reject!;

    return deferred;
}
