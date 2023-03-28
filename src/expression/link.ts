import { getFileTitle, normalizeHeaderForLink } from "expression/normalize";

/** The Obsidian 'link', used for uniquely describing a file, header, or block. */
export class Link {
    /** The file path this link points to. */
    public path: string;
    /** The display name associated with the link. */
    public display?: string;
    /** The block ID or header this link points to within a file, if relevant. */
    public subpath?: string;
    /** Is this link an embedded link (of form '![[hello]]')? */
    public embed: boolean;
    /** The type of this link, which determines what 'subpath' refers to, if anything. */
    public type: "file" | "header" | "block";

    /** Create a link to a specific file. */
    public static file(path: string, embed: boolean = false, display?: string): Link {
        return new Link({
            path,
            embed,
            display,
            subpath: undefined,
            type: "file",
        });
    }

    /** Infer the type of the link from the full internal link path. */
    public static infer(linkpath: string, embed: boolean = false, display?: string): Link {
        if (linkpath.includes("#^")) {
            let split = linkpath.split("#^");
            return Link.block(split[0], split[1], embed, display);
        } else if (linkpath.includes("#")) {
            let split = linkpath.split("#");
            return Link.header(split[0], split[1], embed, display);
        } else return Link.file(linkpath, embed, display);
    }

    /** Create a link to a specific file and header in that file. */
    public static header(path: string, header: string, embed?: boolean, display?: string): Link {
        // Headers need to be normalized to alpha-numeric & with extra spacing removed.
        return new Link({
            path,
            embed,
            display,
            subpath: normalizeHeaderForLink(header),
            type: "header",
        });
    }

    /** Create a link to a specific file and block in that file. */
    public static block(path: string, blockId: string, embed?: boolean, display?: string): Link {
        return new Link({
            path,
            embed,
            display,
            subpath: blockId,
            type: "block",
        });
    }

    /** Load a link from it's raw JSON representation. */
    public static fromObject(object: Record<string, any>): Link {
        return new Link(object);
    }

    private constructor(fields: Partial<Link>) {
        Object.assign(this, fields);
    }

    /** Update this link with a new path. */
    public withPath(path: string): Link {
        return new Link(Object.assign({}, this, { path }));
    }

    /** Return a new link which points to the same location but with a new display value. */
    public withDisplay(display?: string): Link {
        return new Link(Object.assign({}, this, { display }));
    }

    /** Return a new link which has the given embedded status. */
    public withEmbed(embed: boolean): Link {
        if (this.embed == embed) return this;

        return new Link(Object.assign({}, this, { embed }));
    }

    /** Convert a file link into a link to a specific header. */
    public withHeader(header: string): Link {
        return Link.header(this.path, header, this.embed, this.display);
    }

    /** Convert a file link into a link to a specificb lock. */
    public withBlock(block: string): Link {
        return Link.block(this.path, block, this.embed, this.display);
    }

    /** Checks for link equality (i.e., that the links are pointing to the same exact location). */
    public equals(other: Link): boolean {
        if (other == undefined || other == null) return false;

        return this.path == other.path && this.type == other.type && this.subpath == other.subpath;
    }

    /** Convert this link to it's markdown representation. */
    public toString(): string {
        return this.markdown();
    }

    /** Convert this link to a raw object which is serialization-friendly. */
    public toObject(): Record<string, any> {
        return { path: this.path, type: this.type, subpath: this.subpath, display: this.display, embed: this.embed };
    }

    /** Convert any link into a link to its file. */
    public toFile() {
        return Link.file(this.path, this.embed, this.display);
    }

    /** Convert this link into an embedded link. */
    public toEmbed(): Link {
        return this.withEmbed(true);
    }

    /** Convert this link into a non-embedded link. */
    public fromEmbed(): Link {
        return this.withEmbed(false);
    }

    /** Convert this link to markdown so it can be rendered. */
    public markdown(): string {
        let result = (this.embed ? "!" : "") + "[[" + this.obsidianLink();

        if (this.display) {
            result += "|" + this.display;
        } else {
            result += "|" + getFileTitle(this.path);
            if (this.type == "header" || this.type == "block") result += " > " + this.subpath;
        }

        result += "]]";
        return result;
    }

    /** Convert the inner part of the link to something that Obsidian can open / understand. */
    public obsidianLink(): string {
        const escaped = this.path.replace("|", "\\|");
        if (this.type == "header") return escaped + "#" + this.subpath?.replace("|", "\\|");
        if (this.type == "block") return escaped + "#^" + this.subpath?.replace("|", "\\|");
        else return escaped;
    }

    /** The stripped name of the file this link points to. */
    public fileName(): string {
        return getFileTitle(this.path);
    }
}