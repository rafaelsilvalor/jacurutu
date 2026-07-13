import { test } from "node:test";
import assert from "node:assert";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { parseManifest, type Issue } from "@saci/core";

import { runStart } from "./run-start.js";
import type { MakeGateway } from "./run-fetch.js";

// The derived folder for the canned issue below: campaign is alpha-null →
// grouping "AVULSAS"; "[EC] Concursos" → vertical "EC"; entrega month "2026-06";
// leaf = "<KEY>_<slug>". Kept as a literal so the fs assertions are explicit.
const SEGMENTS = ["AVULSAS", "EC", "2026-06", "MCA-101_banner-principal"];
const FIXED_NOW = new Date("2026-07-04T12:00:00Z");

function sampleIssue(overrides: Partial<Issue> = {}): Issue {
  return {
    key: "MCA-101",
    summary: "Banner principal",
    parent_key: "MCA-1",
    parent_summary: "Concurso PF 2026",
    status_jira: "FILA DE EXECUCAO",
    vertical_raw: "[EC] Concursos",
    entrega_iso: "2026-06-10T19:00:00.000-0300",
    copy_url: null,
    copy_source: "fallback",
    jira_updated_at: "2026-06-05T10:00:00-03:00",
    ...overrides,
  };
}

/** A gateway factory whose single-key lookup returns a canned issue; `fetchIssues` is never hit. */
function fakeMakeGateway(issue: Issue): MakeGateway {
  return () => ({
    async fetchIssues(): Promise<Issue[]> {
      throw new Error("fetchIssues is not exercised by the start run");
    },
    async fetchIssueByKey(): Promise<Issue> {
      return issue;
    },
  });
}

/**
 * Build a base dir with a `workspace/` and a sibling `templates/` (the P1
 * default). `templateFiles` seeds `templates/EC/` so template-source resolution
 * has the expected shape (or a deliberately wrong one).
 */
function makeSandbox(templateFiles: string[]): { base: string; workspaceRoot: string } {
  const base = mkdtempSync(path.join(tmpdir(), "saci-runstart-"));
  const workspaceRoot = path.join(base, "workspace");
  mkdirSync(workspaceRoot, { recursive: true });
  if (templateFiles.length > 0) {
    const verticalDir = path.join(base, "templates", "EC");
    mkdirSync(verticalDir, { recursive: true });
    for (const name of templateFiles) {
      writeFileSync(path.join(verticalDir, name), "template-bytes");
    }
  }
  return { base, workspaceRoot };
}

test("start scaffolds dirs, copies the template, and writes a valid manifest", async () => {
  const { base, workspaceRoot } = makeSandbox(["banner.psd"]);
  try {
    const result = await runStart(
      fakeMakeGateway(sampleIssue()),
      "MCA-101",
      workspaceRoot,
      undefined, // P1 default: templates/ sibling of the resolved workspace root
      false,
      FIXED_NOW,
    );

    const leafFolder = path.join(workspaceRoot, ...SEGMENTS);
    assert.strictEqual(result.folderPath, leafFolder);

    // D-A: leaf, editaveis/, editaveis/assets/ all created.
    assert.ok(existsSync(leafFolder));
    assert.ok(existsSync(path.join(leafFolder, "editaveis")));
    assert.ok(existsSync(path.join(leafFolder, "editaveis", "assets")));

    // P2: the editable is renamed to the leaf stem + the source's extension.
    const expectedCopy = path.join(leafFolder, "editaveis", "MCA-101_banner-principal.psd");
    assert.strictEqual(result.copiedFile, expectedCopy);
    assert.ok(existsSync(expectedCopy));

    // The manifest round-trips through parseManifest with every field correct.
    const manifest = parseManifest(
      JSON.parse(readFileSync(path.join(leafFolder, ".saci.json"), "utf8")),
    );
    assert.deepStrictEqual(manifest, {
      schemaVersion: 2,
      jiraKey: "MCA-101",
      localKey: null,
      vertical: "EC",
      slug: "banner-principal",
      template: "banner", // source basename without extension
      drivePath: SEGMENTS,
      history: [{ event: "start", actor: null, at: "2026-07-04T12:00:00.000Z" }],
    });
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
});

test("start --blank skips the copy but writes the same dirs and a blank-template manifest", async () => {
  // No template files seeded: --blank must not consult the templates root.
  const { base, workspaceRoot } = makeSandbox([]);
  try {
    const result = await runStart(
      fakeMakeGateway(sampleIssue()),
      "MCA-101",
      workspaceRoot,
      undefined,
      true,
      FIXED_NOW,
    );

    const leafFolder = path.join(workspaceRoot, ...SEGMENTS);
    assert.strictEqual(result.copiedFile, null);
    assert.ok(existsSync(path.join(leafFolder, "editaveis", "assets")));

    // editaveis/ carries no editable on the blank path.
    assert.ok(!existsSync(path.join(leafFolder, "editaveis", "MCA-101_banner-principal.psd")));

    const manifest = parseManifest(
      JSON.parse(readFileSync(path.join(leafFolder, ".saci.json"), "utf8")),
    );
    assert.strictEqual(manifest.template, "blank");
    assert.strictEqual(manifest.slug, "banner-principal");
    assert.deepStrictEqual(manifest.history, [
      { event: "start", actor: null, at: "2026-07-04T12:00:00.000Z" },
    ]);
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
});

test("start refuses to overwrite an existing leaf folder and writes nothing new (D5)", async () => {
  const { base, workspaceRoot } = makeSandbox(["banner.psd"]);
  try {
    const leafFolder = path.join(workspaceRoot, ...SEGMENTS);
    // Pre-create the collision: leaf + an editaveis/ subdir, but no manifest.
    mkdirSync(path.join(leafFolder, "editaveis"), { recursive: true });

    await assert.rejects(
      runStart(fakeMakeGateway(sampleIssue()), "MCA-101", workspaceRoot, undefined, false, FIXED_NOW),
      (error: Error) => {
        assert.match(error.message, /already exists/);
        assert.match(error.message, /editaveis\/: present/);
        assert.match(error.message, /\.saci\.json: absent/);
        return true;
      },
    );

    // Nothing new was written: no manifest, no copied editable.
    assert.ok(!existsSync(path.join(leafFolder, ".saci.json")));
    assert.ok(!existsSync(path.join(leafFolder, "editaveis", "MCA-101_banner-principal.psd")));
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
});

test("start fails loud on a bad template source and scaffolds nothing (P4)", async () => {
  // Two files in templates/EC/ → not exactly one → fail before any write.
  const { base, workspaceRoot } = makeSandbox(["a.psd", "b.psd"]);
  try {
    await assert.rejects(
      runStart(fakeMakeGateway(sampleIssue()), "MCA-101", workspaceRoot, undefined, false, FIXED_NOW),
      (error: Error) => {
        assert.match(error.message, /Expected exactly one template file/);
        assert.match(error.message, /found 2/);
        return true;
      },
    );

    // The leaf folder was never created: validation precedes any mkdir.
    assert.ok(!existsSync(path.join(workspaceRoot, ...SEGMENTS)));
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
});
