import { getParentFolder } from "utils/normalizers";
import { TFile, TFolder, Vault } from "obsidian";

/** Specific index for tracking objects in relative paths. Specifically tracks top-level page objects. */
export class FolderIndex {
    constructor(public vault: Vault) {}

    /** Get the list of all files under the given path. */
    public get(prefix: string, filter?: (path: string) => boolean): Set<string> {
        let folder = this.vault.getAbstractFileByPath(prefix || "/");
        if (!folder) {
            return FolderIndex.EMPTY_SET;
        } else if (folder instanceof TFolder) {
            return new Set(this.walk(folder, filter));
        } else {
            if (!filter || filter(prefix)) {
                return new Set(prefix);
            } else {
                return FolderIndex.EMPTY_SET;
            }
        }
    }

    /** Get the list of files specifically under the given path. */
    public getExact(prefix: string, filter?: (path: string) => boolean): Set<string> {
        let folder = this.vault.getAbstractFileByPath(prefix || "/");
        if (!folder) {
            return FolderIndex.EMPTY_SET;
        } else if (folder instanceof TFolder) {
            const elements = new Set<string>();
            for (const file of folder.children) {
                if (!(file instanceof TFile)) continue;
                if (filter && !filter(file.path)) continue;

                elements.add(file.path);
            }

            return elements;
        } else {
            if (!filter || filter(prefix)) {
                return new Set(prefix);
            } else {
                return FolderIndex.EMPTY_SET;
            }
        }
    }

    /** Determines if the given path exists in the index. */
    public pathExists(path: string): boolean {
        return this.vault.getAbstractFileByPath(path || "/") != null;
    }

    /** Determines if the given folder exists in the index. */
    public folderExists(folder: string): boolean {
        return this.vault.getAbstractFileByPath(folder || "/") instanceof TFolder;
    }

    /**
     * Use the in-memory prefix index to convert a relative path to an absolute one.
     */
    public resolveRelative(path: string, origin?: string): string {
        if (!origin) return path;
        else if (path.startsWith("/")) return path.substring(1);

        let relativePath = getParentFolder(origin) + "/" + path;
        if (this.pathExists(relativePath)) return relativePath;
        else return path;
    }

    private *walk(folder: TFolder, filter?: (path: string) => boolean): Generator<string> {
        for (const file of folder.children) {
            if (file instanceof TFolder) {
                yield* this.walk(file, filter);
            } else if (filter ? filter(file.path) : true) {
                yield file.path;
            }
        }
    }

    /** Empty placeholder set. */
    private static EMPTY_SET: Set<string> = new Set();
}
