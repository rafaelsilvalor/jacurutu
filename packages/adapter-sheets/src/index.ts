// Public surface of @jacurutu/adapter-sheets: the SpreadsheetGateway implementation of the
// core port, the injected Google-call seam, and one convenience factory. The
// composition root wires this adapter into core (R25); core never imports it.
//
// `jacurutu report --profile <name>` wires it: the composition root builds this gateway and
// hands it the rows an export profile already selects. What the report shows is that
// profile's business, so it is configured rather than decided here.

import {
  authorize,
  defaultCredentialPaths,
  type AuthorizeLog,
  type CredentialPaths,
} from "@jacurutu/adapter-drive";

import { createGoogleSpreadsheetApi } from "./client.js";
import { SpreadsheetGateway } from "./gateway.js";

export { SpreadsheetGateway } from "./gateway.js";
export type { SpreadsheetGatewayOptions } from "./gateway.js";

export { createGoogleSpreadsheetApi } from "./client.js";
export type {
  CreatedSpreadsheet,
  GoogleAuthClient,
  PermissionInput,
  SpreadsheetApi,
} from "./client.js";

/** Inputs for `createSpreadsheetGateway`; both default to the standard ~/.jacurutu setup. */
export interface CreateSpreadsheetGatewayOptions {
  /** Credential locations. Defaults to `defaultCredentialPaths()`. */
  paths?: CredentialPaths;
  /** Sink for authorization progress lines. Defaults to stdout. */
  log?: AuthorizeLog;
}

/**
 * Resolve credentials, authorize, and return a ready gateway — the one call `jacurutu
 * report` makes, in cli.ts and nowhere else. Authorization is adapter-drive's: one
 * Google grant, one `~/.jacurutu/token.json`, no second browser round-trip for the same
 * user (D8).
 */
export async function createSpreadsheetGateway(
  options: CreateSpreadsheetGatewayOptions = {},
): Promise<SpreadsheetGateway> {
  const paths = options.paths ?? defaultCredentialPaths();
  const auth = await authorize(options.log === undefined ? { paths } : { paths, log: options.log });
  return new SpreadsheetGateway({ api: createGoogleSpreadsheetApi(auth) });
}
