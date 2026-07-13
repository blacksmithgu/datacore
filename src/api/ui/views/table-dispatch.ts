import { Dispatch, useMemo, useReducer, Reducer } from "preact/hooks";
import { GenericTableAction, GenericTableState } from "../table-types";

/** The ways that the table can be sorted. */
export type SortDirection = "ascending" | "descending";
export type SortOn = { type: "column"; id: string; direction: SortDirection };

type TableState<T> = GenericTableState<T, "table">;

export function tableReducer<T>(state: TableState<T>, action: GenericTableAction<T, "table">): TableState<T> {
    switch (action.type) {
        case "sort-column": {
					const newSorts = {...state.sorts};
            if (action.direction === undefined) {
							delete newSorts[action.column];
            } else {
                newSorts[action.column] = action.direction;
            }
            return {
                ...state,
							sorts: newSorts,
            };
        }
    }
    console.warn("datacore: Encountered unrecognized operation: " + (action).type);
    return state;
}

export function useTableDispatch<T>(initial: TableState<T> | (() => TableState<T>)): [TableState<T>, Dispatch<GenericTableAction<T, "table">>] {
    const init = useMemo(() => (typeof initial == "function" ? initial() : initial), []);
    return useReducer(tableReducer as Reducer<TableState<T>, GenericTableAction<T, "table">>, init);
}
