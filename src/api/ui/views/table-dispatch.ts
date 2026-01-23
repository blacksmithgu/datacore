import { createContext } from "preact";
import { Dispatch, useMemo, useReducer, Reducer, useContext } from "preact/hooks";

/** The ways that the table can be sorted. */
export type SortDirection = "ascending" | "descending";
export type SortOn = { type: "column"; id: string; direction: SortDirection };

export type TableAction = { type: "sort-column"; column: string; direction: SortDirection | undefined };

export interface TableState {
    /** mapping of column ids to sort directions */
    sorts: Record<string, SortDirection>;
}

export function tableReducer(state: TableState, action: TableAction): TableState {
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
    console.warn("datacore: Encountered unrecognized operation: " + (action as TableAction).type);
    return state;
}

export function useTableDispatch(initial: TableState | (() => TableState)): [TableState, Dispatch<TableAction>] {
    const init = useMemo(() => (typeof initial == "function" ? initial() : initial), []);
    return useReducer(tableReducer as Reducer<TableState, TableAction>, init);
}

export type TableContext = TableState & {
	dispatch: Dispatch<TableAction> 
} 

export const TABLE_CONTEXT = createContext<TableContext | null>(null);

export function useTableContext() {
	return useContext(TABLE_CONTEXT);
}


