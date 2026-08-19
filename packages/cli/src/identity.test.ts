import { test } from "node:test";
import assert from "node:assert";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { readIdentityState, writeIdentityState } from "./identity.js";

/** Sandbox holding one identity file path; `content` seeds it, `null` leaves it missing. */
function makeSandbox(content: string | null): { base: string; filePath: string } {
  const base = mkdtempSync(path.join(tmpdir(), "jacurutu-identity-"));
  const filePath = path.join(base, "identity.json");
  if (content !== null) {
    writeFileSync(filePath, content);
  }
  return { base, filePath };
}

test("missing identity file fails loud with the resolved path and the seed example (D10)", async () => {
  const { base, filePath } = makeSandbox(null);
  try {
    await assert.rejects(readIdentityState(filePath), (error: Error) => {
      assert.match(error.message, new RegExp(filePath.replace(/\\/g, "\\\\")));
      assert.ok(error.message.includes(`{ "prefix": "RAF", "nextSeq": 1 }`));
      return true;
    });
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
});

test("malformed JSON fails loud naming the identity file", async () => {
  const { base, filePath } = makeSandbox("{ not json");
  try {
    await assert.rejects(readIdentityState(filePath), (error: Error) => {
      assert.match(error.message, /Malformed JSON in identity file/);
      return true;
    });
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
});

test("a non-object JSON document fails loud", async () => {
  for (const bad of [`"RAF"`, `[1, 2]`, `null`, `42`]) {
    const { base, filePath } = makeSandbox(bad);
    try {
      await assert.rejects(readIdentityState(filePath), (error: Error) => {
        assert.match(error.message, /must hold a JSON object/);
        return true;
      });
    } finally {
      rmSync(base, { recursive: true, force: true });
    }
  }
});

test("a bad prefix fails loud naming the field", async () => {
  // Missing, non-string, empty, and whitespace-only all count as "not a
  // non-empty string" (D10).
  for (const bad of [`{ "nextSeq": 1 }`, `{ "prefix": 7, "nextSeq": 1 }`, `{ "prefix": "", "nextSeq": 1 }`, `{ "prefix": "   ", "nextSeq": 1 }`]) {
    const { base, filePath } = makeSandbox(bad);
    try {
      await assert.rejects(readIdentityState(filePath), (error: Error) => {
        assert.match(error.message, /prefix must be a non-empty string/);
        return true;
      });
    } finally {
      rmSync(base, { recursive: true, force: true });
    }
  }
});

test("a bad nextSeq fails loud naming the field", async () => {
  // Missing, non-number, non-integer, and < 1 all violate D10.
  for (const bad of [`{ "prefix": "RAF" }`, `{ "prefix": "RAF", "nextSeq": "1" }`, `{ "prefix": "RAF", "nextSeq": 1.5 }`, `{ "prefix": "RAF", "nextSeq": 0 }`]) {
    const { base, filePath } = makeSandbox(bad);
    try {
      await assert.rejects(readIdentityState(filePath), (error: Error) => {
        assert.match(error.message, /nextSeq must be an integer >= 1/);
        return true;
      });
    } finally {
      rmSync(base, { recursive: true, force: true });
    }
  }
});

test("write then read round-trips; on-disk form is 2-space JSON with a trailing newline", async () => {
  const { base, filePath } = makeSandbox(null);
  try {
    await writeIdentityState(filePath, { prefix: "RAF", nextSeq: 4 });

    const raw = readFileSync(filePath, "utf8");
    assert.strictEqual(raw, `{\n  "prefix": "RAF",\n  "nextSeq": 4\n}\n`);

    const state = await readIdentityState(filePath);
    assert.deepStrictEqual(state, { prefix: "RAF", nextSeq: 4 });
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
});
