import { test } from "node:test";
import assert from "node:assert";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { loadFieldMapping, type FieldConfigFile } from "./field-config.js";

// Option A (run-export.test.ts precedent): write the config JSON into a runtime
// temp dir, read it through the real loader, remove the dir in finally. No
// network, no credentials — the loader is fixture-testable end to end.

const SAMPLE_CONFIG: FieldConfigFile = {
  projects: {
    MC: { entrega: "customfield_10031", vertical: "customfield_10065" },
    PMA: { entrega: "customfield_11080", vertical: "customfield_10065" },
  },
};

/** Write a config fixture into `dir`; returns the path. */
function writeConfig(dir: string, config: unknown): string {
  const configPath = path.join(dir, "field-config.json");
  writeFileSync(configPath, JSON.stringify(config), "utf8");
  return configPath;
}

test("loadFieldMapping normalizes MC override to a 1-element candidate list", async () => {
  const dir = mkdtempSync(path.join(tmpdir(), "saci-fieldcfg-"));
  try {
    const configPath = writeConfig(dir, SAMPLE_CONFIG);

    const mapping = await loadFieldMapping(configPath, "MC");

    // Single `entrega` becomes a 1-element `entregaCandidates` — no fallback (D3).
    assert.deepStrictEqual(mapping, {
      entregaCandidates: ["customfield_10031"],
      vertical: "customfield_10065",
    });
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("loadFieldMapping resolves PMA to its distinct entrega field", async () => {
  const dir = mkdtempSync(path.join(tmpdir(), "saci-fieldcfg-"));
  try {
    const configPath = writeConfig(dir, SAMPLE_CONFIG);

    const mapping = await loadFieldMapping(configPath, "PMA");

    assert.deepStrictEqual(mapping, {
      entregaCandidates: ["customfield_11080"],
      vertical: "customfield_10065",
    });
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("loadFieldMapping throws on an unknown project naming key + path", async () => {
  const dir = mkdtempSync(path.join(tmpdir(), "saci-fieldcfg-"));
  try {
    const configPath = writeConfig(dir, SAMPLE_CONFIG);

    await assert.rejects(
      () => loadFieldMapping(configPath, "ZZZ"),
      (error: unknown) => {
        assert.ok(error instanceof Error);
        // Mirrors runExport's unknown-profile throw: names the key AND the path.
        assert.match(error.message, /Unknown project: "ZZZ"/);
        assert.ok(error.message.includes(configPath), "message must name the config path");
        return true;
      },
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("loadFieldMapping surfaces malformed JSON (fail-loud, no silent degrade)", async () => {
  const dir = mkdtempSync(path.join(tmpdir(), "saci-fieldcfg-"));
  try {
    const configPath = path.join(dir, "field-config.json");
    writeFileSync(configPath, "{ not valid json", "utf8");

    await assert.rejects(() => loadFieldMapping(configPath, "MC"));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
