import { setEmojiShorthandCompletionField, setInlineField } from "index/import/inline-field";
import { Indexable } from "index/types/indexable";
import { MarkdownPage, MarkdownSection, MarkdownBlock, MarkdownListItem, MarkdownTaskItem } from "index/types/markdown/markdown";
import { DateTime } from "luxon";
import { Vault } from "obsidian";

export function parseDotField(raw: string, obj: any) {
	if(obj === null) return obj;
	if(raw.contains("."))
			return raw.split(".").reduce((tif, c) => {
					if (typeof tif == "object")
							return tif[c]
					else return tif;
			}, obj || {})
	if(typeof obj === "object" && !Array.isArray(obj)) {
			return obj[raw];
	}
	return obj;
}

export function getField(input: Indexable, field: string) {
	if(input instanceof MarkdownPage) {
			return input.field(field)?.value ?? null
	} else if(input instanceof MarkdownSection) {
			return input.field(field)?.value ?? null
	} else if(input instanceof MarkdownBlock) {
			return input.field(field)?.value ?? null
	} else if(input instanceof MarkdownListItem) {
			return input.field(field)?.value ?? null
	} else {
			return {}
	}
}/** Trim empty ending lines. */
function trimEndingLines(text: string): string {
	let parts = text.split(/\r?\n/u);
	let trim = parts.length - 1;
	while (trim > 0 && parts[trim].trim() == "") trim--;

	return parts.join("\n");
}
/** Set the task completion key on check. */
export function setTaskCompletion(
	originalText: string,
	useEmojiShorthand: boolean,
	completionKey: string,
	completionDateFormat: string,
	complete: boolean
): string {
	const blockIdRegex = /\^[a-z0-9\-]+/i;

	if (!complete && !useEmojiShorthand)
			return trimEndingLines(setInlineField(originalText.trimEnd(), completionKey)).trimEnd();

	let parts = originalText.split(/\r?\n/u);
	const matches = blockIdRegex.exec(parts[parts.length - 1]);

	let processedPart = parts[parts.length - 1].split(blockIdRegex).join(""); // last part without block id
	if (useEmojiShorthand) {
			processedPart = setEmojiShorthandCompletionField(
					processedPart,
					complete ? DateTime.now().toFormat("yyyy-MM-dd") : ""
			);
	} else {
			processedPart = setInlineField(processedPart, completionKey, DateTime.now().toFormat(completionDateFormat));
	}
	processedPart = `${processedPart.trimEnd()}${matches?.length ? " " + matches[0].trim() : ""}`.trimEnd(); // add back block id
	parts[parts.length - 1] = processedPart.trimStart();

	return parts.join("\n");
}

export const LIST_ITEM_REGEX = /^[\s>]*(\d+\.|\d+\)|\*|-|\+)\s*(\[.{0,1}\])?\s*(.*)$/mu;

/** Rewrite a task with the given completion status and new text. */
export async function rewriteTask(vault: Vault, task: MarkdownTaskItem, desiredStatus: string, desiredText?: string) {
	if (desiredStatus == task.$status && (desiredText == undefined || desiredText == task.$text)) return;
	desiredStatus = desiredStatus == "" ? " " : desiredStatus;

	let rawFiletext = await vault.adapter.read(task.$file);
	let hasRN = rawFiletext.contains("\r");
	let filetext = rawFiletext.split(/\r?\n/u);

	if (filetext.length < task.$line) return;
	let match = LIST_ITEM_REGEX.exec(filetext[task.$line]);
	if (!match || match[2].length == 0) return;

	let taskTextParts = task.$text.split("\n");
	// if (taskTextParts[0].trim() != match[3].trim()) return;

	// We have a positive match here at this point, so go ahead and do the rewrite of the status.
	let initialSpacing = /^[\s>]*/u.exec(filetext[task.$line])!![0];
	if (desiredText) {
			let desiredParts = desiredText.split("\n");

			let newTextLines: string[] = [`${initialSpacing}${task.$symbol} [${desiredStatus}] ${desiredParts[0]}`].concat(
					desiredParts.slice(1).map(l => initialSpacing + "\t" + l.trimStart())
			);

			filetext.splice(task.$line, task.$text.split("\n").length, ...newTextLines);
	} else {
			filetext[task.$line] = `${initialSpacing}${task.$symbol} [${desiredStatus}] ${taskTextParts[0].trim()}`;
	}

	let newText = filetext.join(hasRN ? "\r\n" : "\n");
	await vault.adapter.write(task.$file, newText);
}