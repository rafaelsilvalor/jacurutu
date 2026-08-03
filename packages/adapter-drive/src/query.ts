// Drive query-string and MIME-type derivation. Pure string work, no I/O: this is the
// decision-bearing part of `findChild` and `uploadFile`, kept out of the googleapis
// wrapper so it is unit-testable without credentials or network (D4).

import { DEFAULT_UPLOAD_MIME_TYPE } from "./constants.js";

/**
 * Extension -> MIME type for uploads. Deliberately small: it covers what the design
 * workflow actually ships, and anything else falls back to the default rather than
 * growing into a MIME database. Keys are lowercase, without the dot.
 */
const UPLOAD_MIME_TYPES: ReadonlyMap<string, string> = new Map([
  ["txt", "text/plain"],
  ["md", "text/markdown"],
  ["json", "application/json"],
  ["csv", "text/csv"],
  ["pdf", "application/pdf"],
  ["png", "image/png"],
  ["jpg", "image/jpeg"],
  ["jpeg", "image/jpeg"],
  ["gif", "image/gif"],
  ["webp", "image/webp"],
  ["svg", "image/svg+xml"],
  ["zip", "application/zip"],
  ["mp4", "video/mp4"],
  ["psd", "image/vnd.adobe.photoshop"],
  ["ai", "application/postscript"],
  ["indd", "application/x-indesign"],
]);

/**
 * Escape a value for a single-quoted Drive query term. Backslash first — escaping it
 * after the apostrophe would double-escape the backslash the apostrophe just added.
 */
export function escapeDriveQueryValue(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

/**
 * The direct-child-by-name query, in the form proven live by the 046 probe:
 * `'<parent>' in parents and name = '<name>' and trashed = false`. Trashed items are
 * excluded because a name freed by a deletion must read as absent.
 */
export function childByNameQuery(parentId: string, name: string): string {
  const parent = escapeDriveQueryValue(parentId);
  const child = escapeDriveQueryValue(name);
  return `'${parent}' in parents and name = '${child}' and trashed = false`;
}

/**
 * Derive the upload MIME type from the file name's extension, case-insensitively.
 * An unknown or absent extension yields `DEFAULT_UPLOAD_MIME_TYPE` — Drive accepts
 * the bytes either way; the type only affects how Drive previews the file.
 */
export function uploadMimeType(fileName: string): string {
  const dot = fileName.lastIndexOf(".");
  if (dot <= 0 || dot === fileName.length - 1) {
    return DEFAULT_UPLOAD_MIME_TYPE;
  }
  const extension = fileName.slice(dot + 1).toLowerCase();
  return UPLOAD_MIME_TYPES.get(extension) ?? DEFAULT_UPLOAD_MIME_TYPE;
}
