import { faArrowRightFromBracket } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ActionIcon, Divider, Group, Stack, Textarea } from "@mantine/core";
import React from "react";

/**
 * Centralized query editor which allows for writing queries, previewing
 * results, manipulating data, and visualizing it in multple ways.
 */
export function QueryEditor() {
    return (
        <Stack>
            <Group m="md" position="center" align="start" noWrap>
                <ActionIcon mt="sm" variant="subtle" disabled>
                    <FontAwesomeIcon icon={faArrowRightFromBracket} fade />
                </ActionIcon>
                <Textarea p="xs" id="query" minRows={1} size="lg" style={{ flexGrow: 1 }} autosize />
            </Group>
            <Divider />
        </Stack>
    );
}
