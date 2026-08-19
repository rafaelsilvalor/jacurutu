import { test } from "node:test";
import assert from "node:assert";
import { inspect } from "node:util";

import type { ColumnSelection } from "@jacurutu/core";

import type { CreatedSpreadsheet, PermissionInput, SpreadsheetApi } from "./client.js";
import { SHARE_ROLE, SHARE_TYPE } from "./constants.js";
import { SpreadsheetGateway } from "./gateway.js";

const SPREADSHEET_ID = "test-spreadsheet-id";
const SPREADSHEET_NAME = "test-report";

/** Obvious placeholder; a real address is a personal identifier and never enters a file. */
const PLACEHOLDER_RECIPIENT = "test-placeholder-recipient@example.invalid";

/** Two columns, two rows — enough to pin header-first ordering without noise. */
const TABLE: ColumnSelection = {
  headers: ["key", "summary"],
  rows: [
    ["DES-1001", "Banner topo"],
    ["DES-1002", "Card carrossel"],
  ],
};

interface FakeSetup {
  created?: CreatedSpreadsheet;
  failWith?: unknown;
}

interface FakeApi {
  api: SpreadsheetApi;
  /** Method names in the order they were called — what test (d) reads. */
  calls: string[];
  names: string[];
  grids: string[][][];
  permissions: PermissionInput[];
}

/**
 * A recording fake of the injected Google surface (D6). ZERO network, zero
 * credentials: the gateway's decisions are what is under test here.
 */
function fakeApi(setup: FakeSetup = {}): FakeApi {
  const calls: string[] = [];
  const names: string[] = [];
  const grids: string[][][] = [];
  const permissions: PermissionInput[] = [];
  const failIfAsked = (): void => {
    if (setup.failWith !== undefined) {
      throw setup.failWith;
    }
  };
  const api: SpreadsheetApi = {
    async createSpreadsheet(name: string): Promise<CreatedSpreadsheet> {
      calls.push("createSpreadsheet");
      names.push(name);
      failIfAsked();
      return setup.created ?? { id: SPREADSHEET_ID, name };
    },
    async clearValues(): Promise<void> {
      calls.push("clearValues");
      failIfAsked();
    },
    async updateValues(_spreadsheetId: string, values: string[][]): Promise<void> {
      calls.push("updateValues");
      grids.push(values);
      failIfAsked();
    },
    async createPermission(input: PermissionInput): Promise<void> {
      calls.push("createPermission");
      permissions.push(input);
      failIfAsked();
    },
  };
  return { api, calls, names, grids, permissions };
}

function apiError(status: number, message: string): Error & { response: { status: number } } {
  return Object.assign(new Error(message), { response: { status } });
}

test("(a) createSpreadsheet returns the identity and forwards the requested name", async () => {
  const fake = fakeApi();
  const gateway = new SpreadsheetGateway({ api: fake.api });
  assert.deepStrictEqual(await gateway.createSpreadsheet(SPREADSHEET_NAME), {
    id: SPREADSHEET_ID,
    name: SPREADSHEET_NAME,
  });
  assert.deepStrictEqual(fake.names, [SPREADSHEET_NAME]);
});

test("(b) a create response with no id fails loud, naming the operation", async () => {
  const gateway = new SpreadsheetGateway({
    api: fakeApi({ created: { name: SPREADSHEET_NAME } }).api,
  });
  await assert.rejects(
    () => gateway.createSpreadsheet(SPREADSHEET_NAME),
    (error: Error) => {
      assert.match(error.message, /^Sheets createSpreadsheet failed for spreadsheet "test-report"/);
      assert.match(error.message, /without both an id and a name/);
      return true;
    },
  );
});

test("(c) a create response with no name fails loud too — SpreadsheetRef needs both", async () => {
  const gateway = new SpreadsheetGateway({ api: fakeApi({ created: { id: SPREADSHEET_ID } }).api });
  await assert.rejects(
    () => gateway.createSpreadsheet(SPREADSHEET_NAME),
    /without both an id and a name/,
  );
});

test("(d) writeGrid clears the sheet BEFORE it writes, never after", async () => {
  const fake = fakeApi();
  const gateway = new SpreadsheetGateway({ api: fake.api });
  await gateway.writeGrid(SPREADSHEET_ID, TABLE);
  assert.deepStrictEqual(
    fake.calls,
    ["clearValues", "updateValues"],
    "writeGrid did not clear before writing. values.update overwrites only the cells " +
      "the new grid covers and leaves everything below it untouched, so with the order " +
      "reversed — or with the clear removed — a run with fewer rows than the last " +
      "leaves the previous run's tail visible underneath the new grid, inside a report " +
      "the team reads as current. The clear is the port's contract (D4), not a " +
      "precaution: restore clearValues ahead of updateValues.",
  );
});

test("(e) writeGrid sends the header row first, then one row per record, in order", async () => {
  const fake = fakeApi();
  const gateway = new SpreadsheetGateway({ api: fake.api });
  await gateway.writeGrid(SPREADSHEET_ID, TABLE);
  assert.deepStrictEqual(fake.grids, [
    [
      ["key", "summary"],
      ["DES-1001", "Banner topo"],
      ["DES-1002", "Card carrossel"],
    ],
  ]);
});

test("(f) an empty row set still writes the header, so the report is never blank", async () => {
  const fake = fakeApi();
  const gateway = new SpreadsheetGateway({ api: fake.api });
  await gateway.writeGrid(SPREADSHEET_ID, { headers: ["key", "summary"], rows: [] });
  assert.deepStrictEqual(fake.grids, [[["key", "summary"]]]);
  assert.deepStrictEqual(fake.calls, ["clearValues", "updateValues"]);
});

test("(g) shareAsReader forwards the recipient and pins the grantee type and role", async () => {
  const fake = fakeApi();
  const gateway = new SpreadsheetGateway({ api: fake.api });
  await gateway.shareAsReader(SPREADSHEET_ID, PLACEHOLDER_RECIPIENT);
  assert.deepStrictEqual(fake.permissions, [
    {
      spreadsheetId: SPREADSHEET_ID,
      recipient: PLACEHOLDER_RECIPIENT,
      type: SHARE_TYPE,
      role: SHARE_ROLE,
    },
  ]);
  // The constants, not literals: a wider grant must be a new measurement, not a typo.
  assert.strictEqual(SHARE_TYPE, "user");
  assert.strictEqual(SHARE_ROLE, "reader");
});

test("(h) an API failure surfaces classified, naming the operation and the target", async () => {
  const failure = apiError(404, "File not found");
  const gateway = new SpreadsheetGateway({ api: fakeApi({ failWith: failure }).api });
  await assert.rejects(
    () => gateway.writeGrid(SPREADSHEET_ID, TABLE),
    (error: Error) => {
      assert.match(error.message, /^Sheets writeGrid failed for spreadsheet test-spreadsheet-id: /);
      assert.match(error.message, /status=404/);
      // The cause is the sanitized stand-in, never the library's error (errors.ts).
      const cause = error.cause;
      assert.ok(cause instanceof Error);
      assert.notStrictEqual(cause, failure);
      return true;
    },
  );
});

test("(i) a failed share carries no recipient address out of the adapter", async () => {
  // The failure PAYLOAD carries the address, the way a real permissions.create failure
  // does — the outgoing request rides on the thrown error. Without this the test would
  // pass against an adapter that simply never had the address to leak, proving nothing.
  // Google's own MESSAGE also quotes the address, which is the 2026-08-15 live shape:
  // a 400 whose pt-BR text named the invitee. The previous task wrote down that this
  // case was uncovered before anyone had seen it; this fixture is that bound reached.
  const failure = Object.assign(
    new Error(
      `Bad Request. User message: "Voce esta tentando convidar ${PLACEHOLDER_RECIPIENT}. ` +
        `Como nao ha uma Conta do Google associada a esse endereco de e-mail..."`,
    ),
    {
      response: { status: 400 },
      config: {
        url: "https://www.googleapis.com/drive/v3/files/test-spreadsheet-id/permissions",
        data: { type: SHARE_TYPE, role: SHARE_ROLE, emailAddress: PLACEHOLDER_RECIPIENT },
      },
    },
  );
  // Non-vacuity guard: the fixture must actually carry the address, or this proves nothing.
  assert.ok(
    inspect(failure, { depth: null }).includes(PLACEHOLDER_RECIPIENT),
    "the fixture no longer carries the recipient, so this test cannot fail",
  );

  const gateway = new SpreadsheetGateway({ api: fakeApi({ failWith: failure }).api });
  await assert.rejects(
    () => gateway.shareAsReader(SPREADSHEET_ID, PLACEHOLDER_RECIPIENT),
    (error: Error) => {
      // The bound this test used to declare has MOVED: Google's own message text is
      // now scrubbed too, because the adapter knows the recipient and strips it.
      // Two separate proofs, because they are two separate objects.
      // (1) the message the adapter composes:
      assert.ok(!error.message.includes(PLACEHOLDER_RECIPIENT));
      assert.match(error.message, /<recipient>/, "the address was not replaced, only absent");
      // (2) the sanitized cause — the object Node prints on an unhandled rejection,
      // which is the path G-DRIVE-3 exists for. Redacting only (1) closes nothing.
      const cause = error.cause;
      assert.ok(cause instanceof Error);
      assert.ok(!cause.message.includes(PLACEHOLDER_RECIPIENT));
      assert.match(cause.message, /<recipient>/);
      // (3) and nothing reachable from the thrown error at any depth (constraint 2).
      assert.ok(!inspect(error, { depth: null }).includes(PLACEHOLDER_RECIPIENT));
      assert.match(error.message, /^Sheets shareAsReader failed for spreadsheet test-spreadsheet-id: /);
      return true;
    },
  );
});
