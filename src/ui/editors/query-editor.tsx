import { faSearch } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Divider, MantineSize, Stack, Textarea } from "@mantine/core";
import { QUERY } from "index/evaluation/parser";
import { INDEX_NONE, IndexQuery } from "index/types/index-query";
import React, { CSSProperties, useContext, useState } from "react";
import { useFullQuery, useStableCallback } from "ui/hooks";
import { DATACORE_CONTEXT } from "ui/markdown";

/**
 * Centralized query editor which allows for writing queries, previewing
 * results, manipulating data, and visualizing it in multple ways.
 */
export function QueryEditor() {
    const datacore = useContext(DATACORE_CONTEXT);

    // The current root query that the query editor is editing.
    const [query, setQuery] = useState<IndexQuery | undefined>(undefined);
    const results = useFullQuery(datacore, query ?? INDEX_NONE, { debounce: 750 });

    return (
        <Stack id="query-editor" className="query-editor-container">
            <QueryTextarea m="xs" id="query" style={{ flexGrow: 1 }} onSubmit={setQuery} />
            <Divider />
            {query && (
                <p>
                    Found {results.results.length} results in {results.duration * 1000}ms.
                </p>
            )}
        </Stack>
    );
}

/** Input textarea which provides nice query functionality as well as an "onSubmit" hook which only works with valid input queries. */
export const QueryTextarea = React.memo(function QueryTextarea({
    id,
    style,
    onSubmit,
    m,
}: {
    id?: string;
    style?: CSSProperties;
    onSubmit?: (query: IndexQuery | undefined, text: string) => any;
    m?: MantineSize;
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
            styles={{
                input: { fontFamily: "Courier New", fontSize: 20 },
            }}
            autosize
            error={error}
            onKeyDown={handleEnter}
            autoCorrect="none"
            autoComplete="none"
            autoCapitalize="none"
        />
    );
});
