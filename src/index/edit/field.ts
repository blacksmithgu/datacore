/** Central utilities for editing fields by setting new values in files, and tracking outstanding edits. */

import { Provenance } from "expression/field";
import { Literal } from "expression/literal";
import { App, parseFrontMatterTags, parseYaml, stringifyYaml, TFile, Vault } from "obsidian";

/** Edit a field by it's provenance (i.e., source); returns a promise which can be awaited to wait for the file write to complete. */
export function editProvenance(vault: Vault, provenance: Provenance, value: Literal): Promise<void> {
    // TODO: If we ever support custom types, we'll want to change this switch into some kind of dynamic lookup.
    switch (provenance.type) {
        case "frontmatter":
            return editFrontmatter(provenance.file, data => {
                const result = Object.assign({}, data || {}, { [provenance.key]: value });
            });
        case "inline-field":

    }
}

/** Variant of `editRawFrontmatter` which supports all of the `Literal` types and will convert them to and from their raw string representation. */
export function editFrontmatter(app: App, file: TFile, func: (data: Record<string, string>) => Record<string, string>): Promise<void> {
    app.fileManager.processFrontMatter(file, (frontmatter) => {

    });
}