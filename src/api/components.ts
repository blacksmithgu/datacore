import { ListView } from "ui/list";
import { Lit, Markdown } from "ui/markdown";
import { TableView } from "ui/table";

/** Provides convienent access to all of the datacore react components. */
export const COMPONENTS = {
    /** Renders an interactive table. */
    Table: TableView,
    /** Renders an interactive list. */
    List: ListView,
    /** Renders an arbitrary value. */
    Literal: Lit,
    /** Renders markdown using the Obsidian markdown renderer. */
    Markdown: Markdown,
};
