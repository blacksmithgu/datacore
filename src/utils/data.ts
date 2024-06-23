/** Map the values of an object, returning a new object. */
export function mapObjectValues<V, U>(object: Record<string, V>, func: (x: V) => U): Record<string, U> {
    const result: Record<string, U> = {};
    for (const [key, value] of Object.entries(object)) {
        result[key] = func(value);
    }

    return result;
}
