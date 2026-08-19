// The library seam (D6). `SpreadsheetApi` is the narrow, adapter-owned interface the
// gateway depends on — four calls, no googleapis types in the signature — so the
// gateway is unit-testable with a fake and this module is the only place where the
// library's call shapes live. Mirrors adapter-drive's injected `DriveFilesApi`.
//
// Every call shape below is the one proven live in the 2026-08-15 spike probe
// (docs/tasks/2026-08-15-spike-sheets-report/sheets-probe.mjs): `files.create` with
// the spreadsheet MIME type and `supportsAllDrives`; `values.update` anchored at an
// unqualified A1 with `RAW` input; `permissions.create` with `sendNotificationEmail:
// false`. The one call the probe never made is `values.clear` — see CLEAR_RANGE.
//
// Two boundaries are deliberate, because the gateway's decisions must be assertable
// against a fake (D6):
//   - clear and update are separate methods, so a test can assert their ORDER;
//   - the permission's type and role arrive as inputs, so a test can assert that the
//     gateway pins them. Neither is a widening of the port: `shareAsReader` takes no
//     role parameter, and the pinning lives in gateway.ts against the constants.
//
// Not unit tested by design (D6): the smoke covers it, because a fake of the library
// would only assert that the fake matches itself.

import type { DriveAuthClient } from "@jacurutu/adapter-drive";
import { google } from "googleapis";

import {
  CLEAR_RANGE,
  DRIVE_API_VERSION,
  ITEM_FIELDS,
  PERMISSION_FIELDS,
  SHEETS_API_VERSION,
  SPREADSHEET_MIME_TYPE,
  VALUES_RANGE,
  VALUE_INPUT_OPTION,
} from "./constants.js";

/**
 * The OAuth client googleapis accepts. Imported from adapter-drive rather than
 * re-derived here: `googleapis-common` pins `google-auth-library` to an exact version,
 * so the install tree carries two copies whose `OAuth2Client` classes are nominally
 * incompatible (G-DRIVE-2). One shared definition removes the question (D8).
 */
export type GoogleAuthClient = DriveAuthClient;

/**
 * What Drive answered for a create call, before narrowing. Both fields are optional
 * because the wire answer is: deciding that a response without them is a failure is
 * the gateway's job (R4), not this module's.
 */
export interface CreatedSpreadsheet {
  id?: string;
  name?: string;
}

/** One permission grant. `type` and `role` are the caller's policy, not this module's. */
export interface PermissionInput {
  spreadsheetId: string;
  recipient: string;
  type: string;
  role: string;
}

/** The four calls the gateway makes, in domain terms. Faked in the gateway tests. */
export interface SpreadsheetApi {
  /** Create an empty native spreadsheet in the account's My Drive root. */
  createSpreadsheet(name: string): Promise<CreatedSpreadsheet>;
  /** Clear the first sheet over `CLEAR_RANGE`. */
  clearValues(spreadsheetId: string): Promise<void>;
  /** Write `values` into the first sheet, anchored at `VALUES_RANGE`. */
  updateValues(spreadsheetId: string, values: string[][]): Promise<void>;
  /** Grant one permission on the spreadsheet. */
  createPermission(input: PermissionInput): Promise<void>;
}

/** Build the googleapis-backed `SpreadsheetApi` for an authorized client. */
export function createGoogleSpreadsheetApi(auth: GoogleAuthClient): SpreadsheetApi {
  const values = google.sheets({ version: SHEETS_API_VERSION, auth }).spreadsheets.values;
  const drive = google.drive({ version: DRIVE_API_VERSION, auth });

  return {
    async createSpreadsheet(name: string): Promise<CreatedSpreadsheet> {
      const response = await drive.files.create({
        requestBody: { name, mimeType: SPREADSHEET_MIME_TYPE },
        fields: ITEM_FIELDS,
        supportsAllDrives: true,
      });
      // Drive types these as `string | null`; the port speaks optionals, so normalize
      // absence to one shape and let the gateway decide what a missing field means.
      return { id: response.data.id ?? undefined, name: response.data.name ?? undefined };
    },

    async clearValues(spreadsheetId: string): Promise<void> {
      await values.clear({ spreadsheetId, range: CLEAR_RANGE, requestBody: {} });
    },

    async updateValues(spreadsheetId: string, grid: string[][]): Promise<void> {
      await values.update({
        spreadsheetId,
        range: VALUES_RANGE,
        valueInputOption: VALUE_INPUT_OPTION,
        requestBody: { values: grid },
      });
    },

    async createPermission(input: PermissionInput): Promise<void> {
      await drive.permissions.create({
        fileId: input.spreadsheetId,
        requestBody: { type: input.type, role: input.role, emailAddress: input.recipient },
        // The recipient learns about the report from the person who ran Jacurutu, not from
        // a Google notification mail nobody wrote.
        sendNotificationEmail: false,
        supportsAllDrives: true,
        fields: PERMISSION_FIELDS,
      });
    },
  };
}
