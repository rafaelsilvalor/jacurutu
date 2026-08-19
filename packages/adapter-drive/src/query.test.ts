import { test } from "node:test";
import assert from "node:assert";

import { DEFAULT_UPLOAD_MIME_TYPE } from "./constants.js";
import { childByNameQuery, escapeDriveQueryValue, uploadMimeType } from "./query.js";

const PARENT_ID = "test-parent-id";

test("(a) a plain name yields the probe-proven query form", () => {
  assert.strictEqual(
    childByNameQuery(PARENT_ID, "ECJ-1234"),
    "'test-parent-id' in parents and name = 'ECJ-1234' and trashed = false",
  );
});

test("(b) an apostrophe in the name is escaped", () => {
  assert.strictEqual(
    childByNameQuery(PARENT_ID, "Rafael's folder"),
    "'test-parent-id' in parents and name = 'Rafael\\'s folder' and trashed = false",
  );
});

test("(c) a backslash is escaped before the apostrophe rule runs", () => {
  assert.strictEqual(escapeDriveQueryValue("a\\b"), "a\\\\b");
  assert.strictEqual(escapeDriveQueryValue("a\\'b"), "a\\\\\\'b");
});

test("(d) the parent id is escaped too", () => {
  assert.strictEqual(
    childByNameQuery("weird'id", "child"),
    "'weird\\'id' in parents and name = 'child' and trashed = false",
  );
});

test("(e) uploadMimeType maps known extensions", () => {
  assert.strictEqual(uploadMimeType("manifest.json"), "application/json");
  assert.strictEqual(uploadMimeType("brief.pdf"), "application/pdf");
  assert.strictEqual(uploadMimeType("art.psd"), "image/vnd.adobe.photoshop");
});

test("(f) the extension match is case-insensitive", () => {
  assert.strictEqual(uploadMimeType("BANNER.PNG"), "image/png");
  assert.strictEqual(uploadMimeType("Cover.JPEG"), "image/jpeg");
});

test("(g) an unknown extension falls back to the default", () => {
  assert.strictEqual(uploadMimeType("archive.xyz"), DEFAULT_UPLOAD_MIME_TYPE);
});

test("(h) a name with no usable extension falls back to the default", () => {
  assert.strictEqual(uploadMimeType("README"), DEFAULT_UPLOAD_MIME_TYPE);
  assert.strictEqual(uploadMimeType("trailing."), DEFAULT_UPLOAD_MIME_TYPE);
  assert.strictEqual(uploadMimeType(".jacurutu.json"), "application/json");
});
