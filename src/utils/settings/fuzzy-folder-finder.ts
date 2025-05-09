import { AbstractInputSuggest, App, prepareFuzzySearch, SearchResult } from "obsidian";

export class FuzzyFolderSearchSuggest extends AbstractInputSuggest<string> {
    constructor(
        app: App,
        inputEl: HTMLInputElement,
        private threshold: number = -5,
        private respectUserIgnored: boolean = false
    ) {
        super(app, inputEl);
    }

    protected getSuggestions(query: string): string[] | Promise<string[]> {
        const searchFn = prepareFuzzySearch(query);
        const accumulator: Record<string, SearchResult> = {};
        const matchedFolders = this.app.vault.getAllFolders(false).reduce((accum, tfile) => {
            const isIgnoredFile = this.respectUserIgnored && this.app.metadataCache.isUserIgnored(tfile.path);
            if (isIgnoredFile) {
                return accum;
            }

            const searchResult = searchFn(tfile.path);
            const noResults = !searchResult?.score;
            const belowThreshold = searchResult?.score && searchResult.score < this.threshold;

            if (noResults || belowThreshold) {
                return accum;
            }

            if (!accum.hasOwnProperty(tfile.path) || accum[tfile.path].score < searchResult.score) {
                accum[tfile.path] = searchResult;
            }
            return accum;
        }, accumulator);

        return Object.entries(matchedFolders)
            .sort((a, b) => b[1].score - a[1].score)
            .map((result) => result[0]);
    }

    renderSuggestion(value: string, el: HTMLElement): void {
        el.setText(value);
    }
}
