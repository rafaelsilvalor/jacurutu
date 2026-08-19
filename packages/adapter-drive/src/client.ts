// The library seam (D4). `DriveFilesApi` is the narrow, adapter-owned interface the
// gateway depends on — four calls, no googleapis types in the signature — so the
// gateway is unit-testable with a fake and this module is the only place where the
// library's call shapes live. Mirrors adapter-jira's injected `FetchLike`.
//
// Every call shape below is the one proven live in the 046 spike
// (docs/tasks/046-spike-adapter-drive/drive-probe.mjs): `supportsAllDrives`,
// `includeItemsFromAllDrives` on the listing, `alt: "media"` with a text response
// type for content reads, and `media` with a read stream for uploads.
//
// Not unit tested by design (D4): the smoke covers it, because a fake of the
// library would only assert that the fake matches itself.

import { createReadStream } from "node:fs";

import type { DriveItem } from "@jacurutu/core";
import { google, type drive_v3 } from "googleapis";

import { CHILD_LIST_FIELDS, ITEM_FIELDS } from "./constants.js";

/**
 * The OAuth client type `google.drive()` accepts. Derived from `google.auth.OAuth2`
 * rather than imported from `google-auth-library`, and that is load-bearing:
 * `googleapis-common` pins `google-auth-library` to an exact version, so the install
 * tree carries a second copy of the library, and `OAuth2Client` has a private field —
 * making the two copies' classes nominally incompatible. An `OAuth2Client` built from
 * the top-level `google-auth-library` is therefore rejected by googleapis' own
 * generated signatures. `google.auth.OAuth2` is the copy googleapis itself uses.
 */
export type DriveAuthClient = InstanceType<typeof google.auth.OAuth2>;

/** What `createItem` needs. `localFilePath` present means "upload these bytes". */
export interface CreateItemInput {
  parentId: string;
  name: string;
  mimeType: string;
  localFilePath?: string;
}

/**
 * The four Drive calls the gateway makes, expressed in domain terms. Implemented
 * here over googleapis; faked in the gateway tests.
 */
export interface DriveFilesApi {
  /** Metadata for one item by id. */
  getItem(fileId: string): Promise<DriveItem>;
  /** Raw UTF-8 content of one file by id. */
  getText(fileId: string): Promise<string>;
  /** Items matching a Drive query, capped at `pageSize`. */
  listByQuery(query: string, pageSize: number): Promise<DriveItem[]>;
  /** Create a folder (no `localFilePath`) or upload a file (with one). */
  createItem(input: CreateItemInput): Promise<DriveItem>;
}

/**
 * Narrow a raw Drive file into the port's `DriveItem`. Fail-loud (R4): a response
 * missing any of the three fields means the field mask and the response disagree,
 * which is a bug here, not a caller error.
 */
function toDriveItem(file: drive_v3.Schema$File | undefined, context: string): DriveItem {
  const { id, name, mimeType } = file ?? {};
  if (typeof id !== "string" || typeof name !== "string" || typeof mimeType !== "string") {
    throw new Error(
      `Drive returned an incomplete item for ${context}: expected id, name and mimeType (requested fields: ${ITEM_FIELDS}).`,
    );
  }
  return { id, name, mimeType };
}

/**
 * The `media` part of a create call: absent for a folder, a read stream for an upload.
 * Streaming rather than buffering is what lets the library switch to a resumable
 * upload for a large file without the adapter holding it in memory.
 */
function uploadMedia(input: CreateItemInput): drive_v3.Params$Resource$Files$Create["media"] {
  if (input.localFilePath === undefined) {
    return undefined;
  }
  return { mimeType: input.mimeType, body: createReadStream(input.localFilePath) };
}

/** Build the googleapis-backed `DriveFilesApi` for an authorized client. */
export function createGoogleDriveFilesApi(auth: DriveAuthClient): DriveFilesApi {
  const files = google.drive({ version: "v3", auth }).files;

  return {
    async getItem(fileId: string): Promise<DriveItem> {
      const response = await files.get({
        fileId,
        fields: ITEM_FIELDS,
        supportsAllDrives: true,
      });
      return toDriveItem(response.data, `file ${fileId}`);
    },

    async getText(fileId: string): Promise<string> {
      const response = await files.get(
        { fileId, alt: "media", supportsAllDrives: true },
        { responseType: "text" },
      );
      // `alt: "media"` returns the body, not a metadata object; the generated types
      // still describe the metadata overload, so narrow at runtime (R24 — no `any`).
      const body: unknown = response.data;
      return typeof body === "string" ? body : JSON.stringify(body);
    },

    async listByQuery(query: string, pageSize: number): Promise<DriveItem[]> {
      const response = await files.list({
        q: query,
        fields: CHILD_LIST_FIELDS,
        supportsAllDrives: true,
        includeItemsFromAllDrives: true,
        pageSize,
      });
      const matches = response.data.files ?? [];
      return matches.map((file, index) => toDriveItem(file, `query match ${index + 1}`));
    },

    async createItem(input: CreateItemInput): Promise<DriveItem> {
      const response = await files.create({
        requestBody: { name: input.name, parents: [input.parentId], mimeType: input.mimeType },
        media: uploadMedia(input),
        fields: ITEM_FIELDS,
        supportsAllDrives: true,
      });
      return toDriveItem(response.data, `"${input.name}" under ${input.parentId}`);
    },
  };
}
