// Public surface of @saci/adapter-drive: the DriveGateway implementation of the 019
// port (as revised by brief 047), the injected Drive-call seam, the constants
// consumers need, and one convenience factory. The composition root wires this
// adapter into core (R25); core never imports it.

import { authorize, type AuthorizeLog } from "./auth.js";
import { createGoogleDriveFilesApi } from "./client.js";
import { defaultCredentialPaths, type CredentialPaths } from "./credentials.js";
import { DriveGateway } from "./gateway.js";

export { DriveGateway } from "./gateway.js";
export type { DriveGatewayOptions } from "./gateway.js";

export { createGoogleDriveFilesApi } from "./client.js";
export type { CreateItemInput, DriveFilesApi } from "./client.js";

export { authorize } from "./auth.js";
export type { AuthorizeLog, AuthorizeOptions } from "./auth.js";

export { defaultCredentialPaths } from "./credentials.js";
export type { CredentialPaths } from "./credentials.js";

export { DRIVE_SCOPES, FOLDER_MIME_TYPE } from "./constants.js";

/** Inputs for `createDriveGateway`; both default to the standard ~/.saci setup. */
export interface CreateDriveGatewayOptions {
  /** Credential locations. Defaults to `defaultCredentialPaths()`. */
  paths?: CredentialPaths;
  /** Sink for authorization progress lines. Defaults to stdout. */
  log?: AuthorizeLog;
}

/**
 * Resolve credentials, authorize, and return a ready gateway — the one call the smoke
 * and the future `ship` command need. Authorization may open a browser on first run;
 * every later run reuses the stored token.
 */
export async function createDriveGateway(
  options: CreateDriveGatewayOptions = {},
): Promise<DriveGateway> {
  const paths = options.paths ?? defaultCredentialPaths();
  const auth = await authorize(options.log === undefined ? { paths } : { paths, log: options.log });
  return new DriveGateway({ files: createGoogleDriveFilesApi(auth) });
}
