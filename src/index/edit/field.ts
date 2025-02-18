/** Central utilities for editing fields by setting new values in files, and tracking outstanding edits. */

import { Result } from "api/result";
import { Provenance } from "expression/field";
import { Literal } from "expression/literal";
import { setInlineField } from "index/import/inline-field";
import { YamlConversion } from "index/types/yaml";
import { App, TFile } from "obsidian";
import { lineReplace } from "utils/normalizers";

/** Edit a field by it's provenance (i.e., source); returns a promise which can be awaited to wait for the file write to complete. */
export async function editProvenance(app: App, provenance: Provenance, value: Literal): Promise<Result<null, string>> {
    const file = app.vault.getFileByPath(provenance.file);
    if (!file) return Result.failure(`File with path ${provenance.file} does not exist.`);

    // TODO: If we ever support custom types, we'll want to change this switch into some kind of dynamic lookup.
    switch (provenance.type) {
        case "frontmatter":
            await app.fileManager.processFrontMatter(file, (frontmatter) => {
                if (value == null && provenance.key in frontmatter) {
                    delete frontmatter[provenance.key];
                }

                frontmatter[provenance.key] = YamlConversion.yaml(value);
            });

            return Result.success(null);
        case "inline-field":
            return editInlineField(app, file, provenance.line, provenance.key, value);
    }
}

/** Complete workflow for editing an inline field.  */
export async function editInlineField(
    app: App,
    file: TFile,
    line: number,
    key: string,
    value: Literal
): Promise<Result<null, string>> {
    const content = await app.vault.read(file);
    if (!content) return Result.failure(`File with path ${file.path} does not exist.`);

    // Find the extent of the given line (0-indexed), extract it and update.
    const updated = lineReplace(content, line, line + 1, (line) => {
        // TODO: This stringif-ication of the value is not correct and will not work
        // for arrays or objects, but will serve purpose for now...
        if (value == null) return setInlineField(line, key, undefined);
        else return setInlineField(line, key, "" + YamlConversion.yaml(value));
    });

    if (updated == content) return Result.success(null);

    await app.vault.modify(file, updated);
    return Result.success(null);
}
