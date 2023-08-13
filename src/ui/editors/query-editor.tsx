import { faClock, faSearch } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Box, Button, Center, Divider, Group, MantineSize, Select, SelectItem, Stack, Textarea } from "@mantine/core";
import { SearchResult } from "index/datastore";
import { QUERY } from "index/evaluation/parser";
import { INDEX_NONE, IndexQuery } from "index/types/index-query";
import { Indexable, LINKABLE_TYPE } from "index/types/indexable";
import React, { CSSProperties, useContext, useMemo, useState } from "react";
import { useFullQuery, useStableCallback } from "ui/hooks";
import { ListView } from "ui/list";
import { DATACORE_CONTEXT } from "ui/markdown";

/**
 * Centralized query editor which allows for writing queries, previewing
 * results, manipulating data, and visualizing it in multple ways.
 */
export function QueryEditor() {
    const datacore = useContext(DATACORE_CONTEXT);

    // The current root query that the query editor is editing.
    const [query, setQuery] = useState<IndexQuery | undefined>(undefined);
    const results = useFullQuery(datacore, query ?? INDEX_NONE, { debounce: 1000 });
    const [viewtype, setViewtype] = useState<Viewtype>("list");

    return (
        <Stack id="query-viewer" className="query-viewer-container" spacing="2px" h="100vh">
            <Stack id="query-editor" className="query-editor-container" spacing="0px">
                <QueryTextarea m="xs" id="query" style={{ flexGrow: 1 }} onSubmit={setQuery} autofocus />
                <QueryViewtypePicker m="xs" selected={viewtype} onSelect={setViewtype} />
            </Stack>
            <Divider />
            <Box p="md">
                {query ? (
                    <ListController result={results} />
                ) : (
                    <Center>
                        <h4>Enter a query to get started.</h4>
                    </Center>
                )}
            </Box>
        </Stack>
    );
}

/** Button group which provides a way to select the desired base view type. */
export const QueryViewtypePicker = React.memo(function QueryViewtypePicker({
    selected,
    onSelect,
    m,
}: {
    selected: Viewtype;
    onSelect: (option: Viewtype) => any;
    m?: MantineSize;
}) {
    return (
        <Group m={m} align="center" position="center">
            {Object.keys(VIEWTYPE_OPTIONS).map((type) => {
                const viewtype = type as Viewtype;
                return (
                    <Button
                        key={viewtype}
                        variant={selected == type ? "outline" : "filled"}
                        onClick={() => onSelect(viewtype)}
                    >
                        {VIEWTYPE_OPTIONS[viewtype].name}
                    </Button>
                );
            })}
        </Group>
    );
});

/** Input textarea which provides nice query functionality as well as an "onSubmit" hook which only works with valid input queries. */
export const QueryTextarea = React.memo(function QueryTextarea({
    id,
    style,
    onSubmit,
    m,
    autofocus,
}: {
    id?: string;
    style?: CSSProperties;
    onSubmit?: (query: IndexQuery | undefined, text: string) => any;
    m?: MantineSize;
    autofocus?: boolean;
}) {
    const [error, setError] = useState<string | undefined>(undefined);
    const [lastSubmitted, setLastSubmitted] = useState<string | undefined>("");
    const handleEnter = useStableCallback(
        (event: React.KeyboardEvent) => {
            if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();

                const content = ((event.target as any).value as string).trim();
                if (content == lastSubmitted) return;

                let result;
                if (content.length > 0) {
                    const parsed = QUERY.query.parse(content);
                    if (!parsed.status) {
                        setError(
                            `Failed to parse query at (line ${parsed.index.line}, column ${
                                parsed.index.column
                            }): expected ${parsed.expected.join(", ")}`
                        );
                        return;
                    }

                    result = parsed.value;
                } else {
                    result = undefined;
                }

                setError(undefined);
                setLastSubmitted(content);
                onSubmit?.(result, content);
            }
        },
        [onSubmit, lastSubmitted]
    );

    return (
        <Textarea
            icon={<FontAwesomeIcon icon={faSearch} size="lg" />}
            m={m}
            id={id}
            minRows={1}
            size="lg"
            style={style}
            autoFocus={autofocus}
            styles={{
                input: { fontFamily: "Courier New", fontSize: 20 },
            }}
            autosize
            error={error}
            onKeyDown={handleEnter}
            autoCorrect="off"
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
        />
    );
});

/** Wrapper for editing lists. */
export const ListController = React.memo(function ListController({ result }: { result: SearchResult<Indexable> }) {
    const [paging, setPaging] = useState<string | null>("default");
    const pagingOption = useMemo(() => {
        if (!paging || paging == "default") return true;
        else if (paging == "disabled") return false;
        else return parseInt(paging, 10);
    }, [paging]);

    const [style, setStyle] = useState<string | null>("unordered");

    return (
        <Stack>
            <Group id="shared-controls" position="apart">
                <h5>List ({result.results.length} elements)</h5>
                <Group>
                    <span>
                        <FontAwesomeIcon icon={faClock} /> {result.duration * 1000} ms
                    </span>
                    <Select
                        variant="default"
                        id="style-selector"
                        data={LIST_OPTIONS}
                        value={style}
                        onChange={setStyle}
                    />
                    <Select
                        variant="default"
                        id="paging-selector"
                        data={PAGING_OPTIONS}
                        value={paging}
                        onChange={setPaging}
                    />
                </Group>
            </Group>
            <Box style={{ overflow: "scroll" }}>
                <ListView
                    type={(style as any) ?? "unordered"}
                    paging={pagingOption}
                    rows={result.results}
                    renderer={indexableRenderer}
                />
            </Box>
        </Stack>
    );
});

/** Default renderer for indexable objects. */
export function indexableRenderer(element: Indexable) {
    if (element.$types.contains(LINKABLE_TYPE) && "link" in element && element.link) {
        return element.link;
    }

    return `${element.$typename} (${element.$id})`;
}

export const LIST_OPTIONS: SelectItem[] = [
    { value: "ordered", label: "Style: Ordered List" },
    { value: "unordered", label: "Style: Unordered List" },
    { value: "none", label: "Style: Raw List" },
];

/** Default paging options for the view. */
export const PAGING_OPTIONS: SelectItem[] = [
    { value: "default", label: "Paging: Default" },
    { value: "disabled", label: "Paging: Disabled" },
    { value: "50", label: "Paging: 50" },
    { value: "100", label: "Paging: 100" },
    { value: "250", label: "Paging: 250" },
    { value: "1000", label: "Paging: 1000" },
];

/** Metadata for the different ways you can view data. */
export const VIEWTYPE_OPTIONS = {
    list: {
        name: "List",
        controller: ListController,
    },
    embeddings: {
        name: "Embeddings",
    },
    table: {
        name: "Table",
    },
    task: {
        name: "Tasks",
    },
};

export type Viewtype = keyof typeof VIEWTYPE_OPTIONS;
