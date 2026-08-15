// The SpreadsheetGateway implementation of the port declared in @saci/core: create a
// spreadsheet, replace its grid, share it as reader. Everything above one call — what
// the report shows, when it refreshes, who else may see it — belongs to the command
// brief and is deliberately absent here, exactly as 047 left `ship` out of the Drive
// adapter.
//
// The library is injected as a `SpreadsheetApi` (D6), so every decision in this class
// is unit tested against a fake, with no credentials and no network.

import type {
  ColumnSelection,
  SpreadsheetGateway as SpreadsheetGatewayPort,
  SpreadsheetRef,
} from "@saci/core";

import type { SpreadsheetApi } from "./client.js";
import { ITEM_FIELDS, SHARE_ROLE, SHARE_TYPE } from "./constants.js";
import { toSheetsError } from "./errors.js";

/** Construction inputs: the Google call surface, injected (D6). */
export interface SpreadsheetGatewayOptions {
  api: SpreadsheetApi;
}

export class SpreadsheetGateway implements SpreadsheetGatewayPort {
  private readonly api: SpreadsheetApi;

  constructor(options: SpreadsheetGatewayOptions) {
    this.api = options.api;
  }

  /**
   * Create the spreadsheet and return its identity. Fail-loud (R4): a response missing
   * either field means the field mask and the answer disagree, which is a bug here
   * rather than a caller error — and returning a `SpreadsheetRef` with an empty id
   * would send every later call to a file that does not exist.
   */
  async createSpreadsheet(name: string): Promise<SpreadsheetRef> {
    const target = `spreadsheet "${name}"`;
    const created = await this.call("createSpreadsheet", target, () =>
      this.api.createSpreadsheet(name),
    );
    if (!created.id || !created.name) {
      throw new Error(
        `Sheets createSpreadsheet failed for ${target}: Drive returned an item without both an id and a name (requested fields: ${ITEM_FIELDS}).`,
      );
    }
    return { id: created.id, name: created.name };
  }

  /**
   * Replace the first sheet's contents: clear, then write header row and data rows.
   *
   * The clear is the contract, not a precaution. `values.update` writes over only the
   * cells the new grid covers and leaves everything below it untouched, so a run with
   * fewer rows than the last would leave the previous run's tail sitting under the new
   * grid — inside a report the team reads as current (D4). This is the only place that
   * ordering exists, and `gateway.test.ts` (d) pins it.
   */
  async writeGrid(spreadsheetId: string, table: ColumnSelection): Promise<void> {
    const grid = [table.headers, ...table.rows];
    await this.call("writeGrid", `spreadsheet ${spreadsheetId}`, async () => {
      await this.api.clearValues(spreadsheetId);
      await this.api.updateValues(spreadsheetId, grid);
    });
  }

  /**
   * Grant one workspace user read access, with the grantee kind and the grant level
   * pinned to what the spike measured — a wider grant is a new measurement, not a new
   * argument (D2).
   *
   * The target names the spreadsheet and never the recipient: the address is a personal
   * identifier, and an error message is a log line waiting to happen (constraint 2).
   */
  async shareAsReader(spreadsheetId: string, recipient: string): Promise<void> {
    await this.call(
      "shareAsReader",
      `spreadsheet ${spreadsheetId}`,
      () =>
        this.api.createPermission({
          spreadsheetId,
          recipient,
          type: SHARE_TYPE,
          role: SHARE_ROLE,
        }),
      // Google quotes the address back inside its own failure text (measured
      // 2026-08-15), so the seam is told what to strip. Only this method knows it.
      recipient,
    );
  }

  /**
   * Single failure seam: every call goes through here, so no failure is silent and
   * every message names the operation, the target, the status and a fix (R4). The
   * library's own error never travels whole — `toSheetsError` builds the sanitized
   * stand-in (G-DRIVE-3).
   *
   * `secret`, when given, is a value the CALLER knows is sensitive and Google may
   * echo back inside its own message. It is stripped from both the composed message
   * and the sanitized cause.
   */
  private async call<T>(
    operation: string,
    target: string,
    run: () => Promise<T>,
    secret?: string,
  ): Promise<T> {
    try {
      return await run();
    } catch (error) {
      throw toSheetsError(operation, target, error, secret);
    }
  }
}
