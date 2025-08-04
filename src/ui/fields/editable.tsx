/** An editable value; provides the initial value as well as a callback which (asynchronously) edits the value. */
export interface Editable<T> {
    /** The initial value to display. The component should track the current value if it is updated. */
    initial: T;
    /**
     * A callback to update the value in it's original datasource; can optionally provide the expected current value for validation. Returns whether
     * the value was successfully updated.
     */
    update: (incoming: T, original?: T) => Promise<boolean>;
} 