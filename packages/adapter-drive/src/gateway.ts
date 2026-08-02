// The DriveGateway implementation of the 019 port as revised by brief 047: five
// primitives, one Drive call each. Everything above one call — folder-tree walking,
// the verify-never-create policy, manifest parsing — belongs to the ship layer and is
// deliberately absent here.
//
// The library is injected as a `DriveFilesApi` (D4), so every decision in this class
// is unit tested against a fake, with no credentials and no network.

import type { DriveGateway as DriveGatewayPort, DriveItem } from "@saci/core";

import type { DriveFilesApi } from "./client.js";
import { CHILD_PAGE_SIZE, FOLDER_MIME_TYPE } from "./constants.js";
import { toDriveError } from "./errors.js";
import { childByNameQuery, uploadMimeType } from "./query.js";

/** Construction inputs: the Drive call surface, injected (D4). */
export interface DriveGatewayOptions {
  files: DriveFilesApi;
}

export class DriveGateway implements DriveGatewayPort {
  private readonly files: DriveFilesApi;

  constructor(options: DriveGatewayOptions) {
    this.files = options.files;
  }

  /**
   * Resolve a folder by id. Fail-loud twice over (R4): the API failure surfaces
   * classified, and an id that resolves to a file rather than a folder is rejected
   * naming both the id and what it actually is — silently accepting it would let the
   * ship layer upload into a non-folder.
   */
  async resolveFolder(folderId: string): Promise<DriveItem> {
    const item = await this.call("resolveFolder", `folder ${folderId}`, () =>
      this.files.getItem(folderId),
    );
    if (item.mimeType !== FOLDER_MIME_TYPE) {
      throw new Error(
        `Drive resolveFolder failed for folder ${folderId}: expected a folder (${FOLDER_MIME_TYPE}), got ${item.mimeType}.`,
      );
    }
    return item;
  }

  /**
   * Find the direct child named `name` under `parentId`. `null` is the documented
   * absence answer the later verify-never-create policy reads; two or more matches
   * is a genuine ambiguity and throws (R4). The page size is 2 — one match plus one
   * is all it takes to tell those cases apart.
   */
  async findChild(parentId: string, name: string): Promise<DriveItem | null> {
    const target = `child "${name}" under ${parentId}`;
    const matches = await this.call("findChild", target, () =>
      this.files.listByQuery(childByNameQuery(parentId, name), CHILD_PAGE_SIZE),
    );
    if (matches.length === 0) {
      return null;
    }
    if (matches.length > 1) {
      throw new Error(
        `Drive findChild is ambiguous for ${target}: ${matches.length} items share that name (expected at most one).`,
      );
    }
    return matches[0];
  }

  /** Create a folder under `parentId`. No existence check — that is a ship concern. */
  async createFolder(parentId: string, name: string): Promise<DriveItem> {
    return this.call("createFolder", `folder "${name}" under ${parentId}`, () =>
      this.files.createItem({ parentId, name, mimeType: FOLDER_MIME_TYPE }),
    );
  }

  /**
   * Upload a local file into `parentId`, always creating. Drive tolerates duplicate
   * names in one folder, so replace-versus-create is a policy the ship layer decides
   * with `findChild`, not something this primitive guesses.
   */
  async uploadFile(parentId: string, name: string, localFilePath: string): Promise<DriveItem> {
    return this.call("uploadFile", `file "${name}" under ${parentId}`, () =>
      this.files.createItem({
        parentId,
        name,
        mimeType: uploadMimeType(name),
        localFilePath,
      }),
    );
  }

  /** Read a file's content as UTF-8 text. Parsing and validation stay with the caller (D2). */
  async readFileContent(fileId: string): Promise<string> {
    return this.call("readFileContent", `file ${fileId}`, () => this.files.getText(fileId));
  }

  /**
   * Single failure seam: every Drive call goes through here so no failure is silent
   * and every message names the operation, the target, the status and a fix (R4).
   * `findChild`'s `null` is returned above, never produced by a swallowed error.
   */
  private async call<T>(operation: string, target: string, run: () => Promise<T>): Promise<T> {
    try {
      return await run();
    } catch (error) {
      throw toDriveError(operation, target, error);
    }
  }
}
