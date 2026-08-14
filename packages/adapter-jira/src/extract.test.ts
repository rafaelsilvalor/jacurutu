import { test } from "node:test";
import assert from "node:assert";

import {
  adfExtractUrls,
  adfExtractDriveUrls,
  adfExtractText,
  extractUrlsFromComments,
  safeGetEntrega,
  safeGetVertical,
} from "./extract.js";

// Field ids are injected by the caller (D1 — no customfield_* literal lives in
// this module). The tests pass arbitrary ids to confirm the read logic, not the
// real mapping.
const PRIMARY = "primaryField";
const FALLBACK = "fallbackField";
const CANDIDATES = [PRIMARY, FALLBACK];
const VERTICAL = "verticalField";

const DRIVE_URL = "https://drive.google.com/file/d/abc123/view";
const DOCS_URL = "https://docs.google.com/document/d/xyz789/edit";
const NON_DRIVE_URL = "https://example.com/not-drive";

// --- adfExtractUrls / adfExtractDriveUrls -----------------------------------

test("Drive URL in an inlineCard attrs.url is extracted", () => {
  const node = {
    type: "doc",
    content: [{ type: "inlineCard", attrs: { url: DRIVE_URL } }],
  };
  assert.deepStrictEqual(adfExtractDriveUrls(node), [DRIVE_URL]);
});

test("Drive URL in a text link mark href is extracted", () => {
  const node = {
    type: "doc",
    content: [
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            text: "copy here",
            marks: [{ type: "link", attrs: { href: DOCS_URL } }],
          },
        ],
      },
    ],
  };
  assert.deepStrictEqual(adfExtractDriveUrls(node), [DOCS_URL]);
});

test("raw Drive URL inside text body is extracted", () => {
  const node = {
    type: "doc",
    content: [
      {
        type: "paragraph",
        content: [{ type: "text", text: `see ${DRIVE_URL} now` }],
      },
    ],
  };
  assert.deepStrictEqual(adfExtractDriveUrls(node), [DRIVE_URL]);
});

test("non-Drive URL is rejected by the Drive filter", () => {
  const node = {
    type: "doc",
    content: [{ type: "inlineCard", attrs: { url: NON_DRIVE_URL } }],
  };
  assert.deepStrictEqual(adfExtractDriveUrls(node), []);
});

test("markdown trailing suffix is stripped before dedup", () => {
  const node = {
    type: "doc",
    content: [
      {
        type: "paragraph",
        content: [{ type: "text", text: `[link](${DRIVE_URL})` }],
      },
    ],
  };
  assert.deepStrictEqual(adfExtractDriveUrls(node), [DRIVE_URL]);
});

test("duplicate Drive URLs are deduplicated in appearance order", () => {
  const node = {
    type: "doc",
    content: [
      { type: "inlineCard", attrs: { url: DOCS_URL } },
      { type: "inlineCard", attrs: { url: DRIVE_URL } },
      { type: "inlineCard", attrs: { url: DOCS_URL } },
    ],
  };
  assert.deepStrictEqual(adfExtractDriveUrls(node), [DOCS_URL, DRIVE_URL]);
});

test("adfExtractUrls is permissive — yields non-Drive URLs too", () => {
  const node = {
    type: "doc",
    content: [{ type: "blockCard", attrs: { url: NON_DRIVE_URL } }],
  };
  assert.deepStrictEqual(adfExtractUrls(node), [NON_DRIVE_URL]);
});

test("adfExtractUrls returns empty for a non-record node", () => {
  assert.deepStrictEqual(adfExtractUrls(null), []);
  assert.deepStrictEqual(adfExtractUrls("text"), []);
  assert.deepStrictEqual(adfExtractUrls(undefined), []);
});

// --- adfExtractText ---------------------------------------------------------

test("adfExtractText separates sibling block nodes with a line break", () => {
  const node = {
    type: "doc",
    content: [
      { type: "paragraph", content: [{ type: "text", text: "hello" }] },
      { type: "paragraph", content: [{ type: "text", text: "world" }] },
    ],
  };
  assert.strictEqual(adfExtractText(node), "hello\nworld");
});

// A mark splits one phrase into two text nodes. The space belongs to the first
// of them and is the only one the projection may carry.
test("adfExtractText joins inline runs without inserting a space", () => {
  const node = {
    type: "doc",
    content: [
      {
        type: "paragraph",
        content: [
          { type: "text", text: "Pauta " },
          { type: "text", text: "415", marks: [{ type: "strong" }] },
        ],
      },
    ],
  };
  assert.strictEqual(adfExtractText(node), "Pauta 415");
});

test("adfExtractText renders a hardBreak as a line break", () => {
  const node = {
    type: "doc",
    content: [
      {
        type: "paragraph",
        content: [
          { type: "text", text: "first" },
          { type: "hardBreak" },
          { type: "text", text: "second" },
        ],
      },
    ],
  };
  assert.strictEqual(adfExtractText(node), "first\nsecond");
});

test("adfExtractText gives each nested list item its own line", () => {
  const item = (text: string) => ({
    type: "listItem",
    content: [{ type: "paragraph", content: [{ type: "text", text }] }],
  });
  const node = {
    type: "doc",
    content: [{ type: "bulletList", content: [item("one"), item("two")] }],
  };
  assert.strictEqual(adfExtractText(node), "one\ntwo");
});

// F6 regression (docs/explorations/jira-copy-locality.md): the flattened
// projection capped this count at 1 however many frames the source carried.
// The regex is written here rather than imported — the production marker
// parser is out of scope and has no site in this repository.
test("adfExtractText keeps one frame marker per line for an anchored regex", () => {
  const frame = (n: number) => ({
    type: "paragraph",
    content: [{ type: "text", text: `L${n}: frame copy` }],
  });
  const node = { type: "doc", content: [frame(1), frame(2), frame(3)] };
  const markers = adfExtractText(node).match(/^\s*L\d+\s*:/gm) ?? [];
  assert.strictEqual(markers.length, 3);
});

test("adfExtractText absorbs an empty paragraph and a non-record child", () => {
  const node = {
    type: "doc",
    content: [
      { type: "paragraph", content: [{ type: "text", text: "kept " }] },
      { type: "paragraph" },
      "not a node",
      { type: "paragraph", content: [{ type: "text", text: "also kept" }] },
    ],
  };
  assert.strictEqual(adfExtractText(node), "kept\nalso kept");
});

test("adfExtractText returns empty for a non-record node", () => {
  assert.strictEqual(adfExtractText(null), "");
});

// --- extractUrlsFromComments ------------------------------------------------

test("comment field as object with comments[] yields Drive URLs", () => {
  const commentsField = {
    comments: [
      {
        body: {
          type: "doc",
          content: [{ type: "inlineCard", attrs: { url: DRIVE_URL } }],
        },
      },
    ],
  };
  assert.deepStrictEqual(extractUrlsFromComments(commentsField), [DRIVE_URL]);
});

test("comment field as bare list yields Drive URLs", () => {
  const commentsField = [
    {
      body: {
        type: "doc",
        content: [{ type: "inlineCard", attrs: { url: DOCS_URL } }],
      },
    },
  ];
  assert.deepStrictEqual(extractUrlsFromComments(commentsField), [DOCS_URL]);
});

test("comments dedup across multiple comment bodies preserves order", () => {
  const commentsField = {
    comments: [
      {
        body: {
          type: "doc",
          content: [{ type: "inlineCard", attrs: { url: DRIVE_URL } }],
        },
      },
      {
        body: {
          type: "doc",
          content: [
            { type: "inlineCard", attrs: { url: DRIVE_URL } },
            { type: "inlineCard", attrs: { url: DOCS_URL } },
          ],
        },
      },
    ],
  };
  assert.deepStrictEqual(extractUrlsFromComments(commentsField), [
    DRIVE_URL,
    DOCS_URL,
  ]);
});

test("empty or unsupported comment field yields no URLs", () => {
  assert.deepStrictEqual(extractUrlsFromComments(null), []);
  assert.deepStrictEqual(extractUrlsFromComments(""), []);
  assert.deepStrictEqual(extractUrlsFromComments(42), []);
});

// --- safeGetEntrega ---------------------------------------------------------

test("safeGetEntrega returns the first candidate when present", () => {
  const fields = { [PRIMARY]: "2026-06-01T10:00:00.000-0300" };
  assert.deepStrictEqual(safeGetEntrega(fields, CANDIDATES), [
    "2026-06-01T10:00:00.000-0300",
    PRIMARY,
  ]);
});

test("safeGetEntrega returns a later candidate when the first is absent", () => {
  const fields = { [FALLBACK]: "2026-07-15T09:30:00.000-0300" };
  assert.deepStrictEqual(safeGetEntrega(fields, CANDIDATES), [
    "2026-07-15T09:30:00.000-0300",
    FALLBACK,
  ]);
});

test("safeGetEntrega returns [null, null] when no candidate is present", () => {
  assert.deepStrictEqual(safeGetEntrega({}, CANDIDATES), [null, null]);
});

test("safeGetEntrega honors a single-element candidate list (no fallback)", () => {
  const present = { [PRIMARY]: "2026-06-01T10:00:00.000-0300" };
  assert.deepStrictEqual(safeGetEntrega(present, [PRIMARY]), [
    "2026-06-01T10:00:00.000-0300",
    PRIMARY,
  ]);
  // A value under a non-listed field is not picked up — the single candidate is absent.
  assert.deepStrictEqual(safeGetEntrega({ [FALLBACK]: "x" }, [PRIMARY]), [null, null]);
});

// --- safeGetVertical --------------------------------------------------------

test("safeGetVertical reads value from the array shape", () => {
  const fields = { [VERTICAL]: [{ value: "[EC] Concursos" }] };
  assert.strictEqual(safeGetVertical(fields, VERTICAL), "[EC] Concursos");
});

test("safeGetVertical reads value from the bare object shape", () => {
  const fields = { [VERTICAL]: { value: "[EC] Medicina" } };
  assert.strictEqual(safeGetVertical(fields, VERTICAL), "[EC] Medicina");
});

test("safeGetVertical returns null when the field is absent", () => {
  assert.strictEqual(safeGetVertical({}, VERTICAL), null);
});
