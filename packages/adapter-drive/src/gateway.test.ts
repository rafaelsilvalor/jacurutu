import { test } from "node:test";
import assert from "node:assert";

import type { DriveItem } from "@saci/core";

import type { CreateItemInput, DriveFilesApi } from "./client.js";
import { CHILD_PAGE_SIZE, DEFAULT_UPLOAD_MIME_TYPE, FOLDER_MIME_TYPE } from "./constants.js";
import { DriveGateway } from "./gateway.js";

const PARENT_ID = "test-parent-id";

const FOLDER: DriveItem = {
  id: "test-folder-id",
  name: "TEST-FOLDER",
  mimeType: FOLDER_MIME_TYPE,
};

const FILE: DriveItem = {
  id: "test-file-id",
  name: "brief.pdf",
  mimeType: "application/pdf",
};

interface FakeSetup {
  item?: DriveItem;
  matches?: DriveItem[];
  created?: DriveItem;
  text?: string;
  failWith?: unknown;
}

interface FakeApi {
  files: DriveFilesApi;
  fileIds: string[];
  queries: string[];
  pageSizes: number[];
  creates: CreateItemInput[];
}

/**
 * A recording fake of the injected Drive surface (D4). ZERO network, zero
 * credentials: the gateway's decisions are what is under test here.
 */
function fakeFilesApi(setup: FakeSetup = {}): FakeApi {
  const fileIds: string[] = [];
  const queries: string[] = [];
  const pageSizes: number[] = [];
  const creates: CreateItemInput[] = [];
  const failIfAsked = (): void => {
    if (setup.failWith !== undefined) {
      throw setup.failWith;
    }
  };
  const files: DriveFilesApi = {
    async getItem(fileId: string): Promise<DriveItem> {
      fileIds.push(fileId);
      failIfAsked();
      return setup.item ?? FOLDER;
    },
    async getText(fileId: string): Promise<string> {
      fileIds.push(fileId);
      failIfAsked();
      return setup.text ?? "";
    },
    async listByQuery(query: string, pageSize: number): Promise<DriveItem[]> {
      queries.push(query);
      pageSizes.push(pageSize);
      failIfAsked();
      // Capped like the real listing, which never returns more rows than asked for. A
      // fake that ignored `pageSize` would hand `setup.matches` straight to the gateway
      // and leave CHILD_PAGE_SIZE unfalsifiable — test (e) is what turns this cap into
      // a constraint on the constant's value.
      return (setup.matches ?? []).slice(0, pageSize);
    },
    async createItem(input: CreateItemInput): Promise<DriveItem> {
      creates.push(input);
      failIfAsked();
      return setup.created ?? FOLDER;
    },
  };
  return { files, fileIds, queries, pageSizes, creates };
}

function apiError(status: number, message: string): Error & { response: { status: number } } {
  return Object.assign(new Error(message), { response: { status } });
}

test("(a) resolveFolder returns the item and passes the id through", async () => {
  const fake = fakeFilesApi({ item: FOLDER });
  const gateway = new DriveGateway({ files: fake.files });
  assert.deepStrictEqual(await gateway.resolveFolder("test-folder-id"), FOLDER);
  assert.deepStrictEqual(fake.fileIds, ["test-folder-id"]);
});

test("(b) resolveFolder rejects an id whose mimeType is not a folder", async () => {
  const gateway = new DriveGateway({ files: fakeFilesApi({ item: FILE }).files });
  await assert.rejects(
    () => gateway.resolveFolder("test-file-id"),
    (error: Error) => {
      assert.match(error.message, /resolveFolder failed for folder test-file-id/);
      assert.ok(error.message.includes(FOLDER_MIME_TYPE));
      assert.ok(error.message.includes("application/pdf"));
      return true;
    },
  );
});

test("(c) findChild returns the single match and queries with the capped page size", async () => {
  const fake = fakeFilesApi({ matches: [FOLDER] });
  const gateway = new DriveGateway({ files: fake.files });
  assert.deepStrictEqual(await gateway.findChild(PARENT_ID, "TEST-FOLDER"), FOLDER);
  assert.deepStrictEqual(fake.queries, [
    "'test-parent-id' in parents and name = 'TEST-FOLDER' and trashed = false",
  ]);
  // The same constant on both sides, deliberately: this pins that findChild forwards
  // CHILD_PAGE_SIZE exactly once — not a literal, not an unrelated number, not
  // `undefined` — and says nothing about its value. Test (e) constrains the value.
  assert.deepStrictEqual(fake.pageSizes, [CHILD_PAGE_SIZE]);
});

test("(d) findChild returns null when the child is absent", async () => {
  const gateway = new DriveGateway({ files: fakeFilesApi({ matches: [] }).files });
  assert.strictEqual(await gateway.findChild(PARENT_ID, "MISSING"), null);
});

/**
 * Ambiguity detection, and — through the fake's page-size cap — the lower bound on
 * CHILD_PAGE_SIZE that makes it reachable at all. The two twins are seeded behind the
 * cap, so the second one arrives only because the constant asks for a second row.
 */
test("(e) findChild throws on two same-named children, which the page size reveals", async () => {
  const twin: DriveItem = { ...FOLDER, id: "test-folder-id-2" };
  const gateway = new DriveGateway({ files: fakeFilesApi({ matches: [FOLDER, twin] }).files });
  await assert.rejects(
    () => gateway.findChild(PARENT_ID, "TEST-FOLDER"),
    (error: Error) => {
      assert.match(error.message, /ambiguous/);
      assert.ok(error.message.includes(PARENT_ID));
      assert.ok(error.message.includes("TEST-FOLDER"));
      assert.match(error.message, /2 items/);
      return true;
    },
    "findChild accepted two same-named children silently instead of " +
      `throwing. CHILD_PAGE_SIZE is ${CHILD_PAGE_SIZE}, and the listing ` +
      "returns at most that many rows: below 2, the second sibling never " +
      "arrives, a genuine conflict reads as a single match, and the " +
      "verify-never-create policy above this port reuses whichever folder " +
      "Drive happened to list first. The constant is a correctness bound " +
      "on this test, not a tuning knob — restore it to at least 2.",
  );
});

test("(f) createFolder sends the folder MIME type and no local path", async () => {
  const fake = fakeFilesApi({ created: FOLDER });
  const gateway = new DriveGateway({ files: fake.files });
  assert.deepStrictEqual(await gateway.createFolder(PARENT_ID, "TEST-FOLDER"), FOLDER);
  assert.deepStrictEqual(fake.creates, [
    { parentId: PARENT_ID, name: "TEST-FOLDER", mimeType: FOLDER_MIME_TYPE },
  ]);
});

test("(g) uploadFile derives the MIME type from the extension and forwards the path", async () => {
  const fake = fakeFilesApi({ created: FILE });
  const gateway = new DriveGateway({ files: fake.files });
  const local = "somewhere/brief.pdf";
  assert.deepStrictEqual(await gateway.uploadFile(PARENT_ID, "brief.pdf", local), FILE);
  assert.deepStrictEqual(fake.creates, [
    {
      parentId: PARENT_ID,
      name: "brief.pdf",
      mimeType: "application/pdf",
      localFilePath: local,
    },
  ]);
});

test("(h) uploadFile falls back to the default MIME type for an unknown extension", async () => {
  const fake = fakeFilesApi({ created: FILE });
  const gateway = new DriveGateway({ files: fake.files });
  await gateway.uploadFile(PARENT_ID, "artifact.xyz", "somewhere/artifact.xyz");
  assert.strictEqual(fake.creates[0].mimeType, DEFAULT_UPLOAD_MIME_TYPE);
});

test("(i) readFileContent passes the text through untouched", async () => {
  const body = '{"schemaVersion":2}\n';
  const fake = fakeFilesApi({ text: body });
  const gateway = new DriveGateway({ files: fake.files });
  assert.strictEqual(await gateway.readFileContent("test-file-id"), body);
  assert.deepStrictEqual(fake.fileIds, ["test-file-id"]);
});

test("(j) an API failure surfaces classified, naming the operation and the target", async () => {
  const failure = apiError(404, "File not found");
  const gateway = new DriveGateway({ files: fakeFilesApi({ failWith: failure }).files });
  await assert.rejects(
    () => gateway.readFileContent("test-file-id"),
    (error: Error) => {
      assert.match(error.message, /^Drive readFileContent failed for file test-file-id: /);
      assert.match(error.message, /status=404/);
      // The cause is the sanitized stand-in, never the library's error object (errors.ts).
      const cause = error.cause;
      assert.ok(cause instanceof Error);
      assert.notStrictEqual(cause, failure);
      assert.strictEqual(cause.message, failure.message);
      return true;
    },
  );
});

test("(k) a findChild failure is classified too, never swallowed into null", async () => {
  const gateway = new DriveGateway({
    files: fakeFilesApi({ failWith: apiError(403, "Insufficient Permission") }).files,
  });
  await assert.rejects(
    () => gateway.findChild(PARENT_ID, "TEST-FOLDER"),
    (error: Error) => {
      assert.match(error.message, /^Drive findChild failed for child "TEST-FOLDER" under test-parent-id: /);
      assert.match(error.message, /status=403/);
      return true;
    },
  );
});
