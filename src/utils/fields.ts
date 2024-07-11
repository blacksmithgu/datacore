import { Field } from "expression/field";
import { Literal, Literals } from "expression/literal";
import { setInlineField } from "index/import/inline-field";
import { MarkdownTaskItem } from "index/types/markdown";
import { App, Vault } from "obsidian";
import { Dispatch, useCallback, useContext } from "preact/hooks";
import { APP_CONTEXT } from "ui/markdown";
import { rewriteTask } from "./task";
import { EditableAction } from "ui/fields/editable";

export async function rewriteFieldInFile(field: Field, newValue: Literal, app: App) {
    switch (field.provenance?.type) {
        case "frontmatter": {
            const tFile = app.vault.getFileByPath(field.provenance.file);
            if (!tFile) return;
            await app.fileManager.processFrontMatter(tFile, (fm) => {
                fm[field.key] = newValue;
            });
            break;
        }
        case "intrinsic":
            break;
        case "inline-field": {
            const tFile = app.vault.getFileByPath(field.provenance.file);
            if (!tFile) return;
            const content = await app.vault.read(tFile);
            const lines = content.split(/\r?\n?/);
            const line = lines[field.provenance.line];
            const newLine = setInlineField(line, field.key, Literals.toString(newValue));
            lines[field.provenance.line] = newLine;
            await app.vault.modify(tFile, lines.join("\n"));
        }
    }
}

export function useSetField<T extends Literal>(field: Field, onChange?: (newValue: T) => void) {
    const app = useContext(APP_CONTEXT);
    return useCallback(
        (newValue: T) => {
            rewriteFieldInFile(field, newValue, app).then(() => {
                if (onChange) onChange(newValue);
            });
        },
        [field, onChange]
    );
}
export async function setTaskText(text: string, item: MarkdownTaskItem, vault: Vault) {
    let withFields = `${text}${Object.keys(item.$infields).length ? " " : ""}`;
    for (let field in item.$infields) {
        withFields = setInlineField(withFields, field, item.$infields[field].raw);
    }
    await rewriteTask(vault, item, item.$status, withFields);
}
export function useFinalizer<T>(newValue: T, dispatch: Dispatch<EditableAction<T>>) {
    return async function () {
        dispatch({
            type: "commit",
            newValue: newValue,
        });
        dispatch({
            type: "editing-toggled",
            newValue: false,
        });
    };
}
