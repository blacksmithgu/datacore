import { faArrowRightFromBracket } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Group, Stack, Textarea } from "@mantine/core";
import { h } from "preact";

/**
 * Centralized query editor which allows for writing queries, previewing
 * results, manipulating data, and visualizing it in multple ways.
 */
export function QueryEditor() {
    return <Stack>
        <Group m="md" position="center" align="start" noWrap>
            <FontAwesomeIcon style={{ margin: "8px" }} icon={faArrowRightFromBracket} fade />
            <Textarea id="query" minRows={1} size="lg" ff="Courier New" autosize placeholder="Enter Query...">
            </Textarea>
        </Group>
    </Stack>
}