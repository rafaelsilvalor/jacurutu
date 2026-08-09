import { test } from "node:test";
import assert from "node:assert";
import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { parseManifest, type Issue } from "@saci/core";

import { runStart, runStartLocal, type StartLocalOptions } from "./run-start.js";
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
    // Port ripple: the start run does not call the pre-flight (D3 — `runStart`
    // is untouched by the credential-guard brief). Explicit throw, matching
    // `fetchIssues` below, so a future silent call is caught (R4).
    async verifyCredentials(): Promise<void> {
      throw new Error("verifyCredentials is not exercised by the start run");
    },
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
      undefined, // no --variation: no variacao segment, no trailing underscore
      FIXED_NOW,
    );

    const leafFolder = path.join(workspaceRoot, ...SEGMENTS);
    assert.strictEqual(result.folderPath, leafFolder);

    // D-A: leaf, editaveis/, editaveis/assets/ all created. The leaf FOLDER
    // keeps the uppercase-key stem (042 D5) — only the FILE name changes.
    assert.ok(existsSync(leafFolder));
    assert.ok(existsSync(path.join(leafFolder, "editaveis")));
    assert.ok(existsSync(path.join(leafFolder, "editaveis", "assets")));

    // 042 D2: the editable is vertical_key_descricao (lowercase) + the
    // source's extension — not the leaf stem.
    const expectedCopy = path.join(leafFolder, "editaveis", "ec_mca-101_banner-principal.psd");
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

test("start with --variation appends the sanitized variacao segment (042 D2/D3)", async () => {
  const { base, workspaceRoot } = makeSandbox(["banner.psd"]);
  try {
    const result = await runStart(
      fakeMakeGateway(sampleIssue()),
      "MCA-101",
      workspaceRoot,
      undefined,
      false,
      "Carrossel",
      FIXED_NOW,
    );
    assert.strictEqual(
      result.copiedFile,
      path.join(workspaceRoot, ...SEGMENTS, "editaveis", "ec_mca-101_banner-principal_carrossel.psd"),
    );
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
      "Carrossel", // 042 D3: no file is copied on --blank, so --variation is accepted and ignored
      FIXED_NOW,
    );

    const leafFolder = path.join(workspaceRoot, ...SEGMENTS);
    assert.strictEqual(result.copiedFile, null);
    assert.ok(existsSync(path.join(leafFolder, "editaveis", "assets")));

    // editaveis/ carries no editable on the blank path.
    assert.ok(!existsSync(path.join(leafFolder, "editaveis", "ec_mca-101_banner-principal_carrossel.psd")));

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
      runStart(
        fakeMakeGateway(sampleIssue()),
        "MCA-101",
        workspaceRoot,
        undefined,
        false,
        undefined,
        FIXED_NOW,
      ),
      (error: Error) => {
        assert.match(error.message, /already exists/);
        assert.match(error.message, /editaveis\/: present/);
        assert.match(error.message, /\.saci\.json: absent/);
        return true;
      },
    );

    // Nothing new was written: no manifest, no copied editable.
    assert.ok(!existsSync(path.join(leafFolder, ".saci.json")));
    assert.ok(!existsSync(path.join(leafFolder, "editaveis", "ec_mca-101_banner-principal.psd")));
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
});

test("jira-born start returns localKey null (D12)", async () => {
  const { base, workspaceRoot } = makeSandbox(["banner.psd"]);
  try {
    const result = await runStart(
      fakeMakeGateway(sampleIssue()),
      "MCA-101",
      workspaceRoot,
      undefined,
      false,
      undefined,
      FIXED_NOW,
    );
    assert.strictEqual(result.localKey, null);
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
});

// ---------------------------------------------------------------------------
// Local-born path (brief 036). The sandbox reuses makeSandbox's templates/EC
// layout and adds an identity file seeded at nextSeq 1.

/** Read the identity file's counter straight off the disk. */
function nextSeqOnDisk(identityFilePath: string): number {
  return (JSON.parse(readFileSync(identityFilePath, "utf8")) as { nextSeq: number }).nextSeq;
}

function makeLocalSandbox(templateFiles: string[]): {
  base: string;
  workspaceRoot: string;
  identityFilePath: string;
} {
  const { base, workspaceRoot } = makeSandbox(templateFiles);
  const identityFilePath = path.join(base, "identity.json");
  writeFileSync(identityFilePath, `{\n  "prefix": "RAF",\n  "nextSeq": 1\n}\n`);
  return { base, workspaceRoot, identityFilePath };
}

/** Baseline local options against a sandbox; tests override per case. */
function localOptions(
  workspaceRoot: string,
  identityFilePath: string,
  overrides: Partial<StartLocalOptions> = {},
): StartLocalOptions {
  return {
    identityFilePath,
    vertical: "EC",
    title: "Banner principal",
    workspaceRoot,
    blank: false,
    now: FIXED_NOW,
    ...overrides,
  };
}

test("start --local scaffolds offline, mints the key, and increments the counter (D6/D7)", async () => {
  const { base, workspaceRoot, identityFilePath } = makeLocalSandbox(["banner.psd"]);
  try {
    const result = await runStartLocal(
      localOptions(workspaceRoot, identityFilePath, { due: "2026-08-15" }),
    );

    // --due 2026-08-15 → month segment 2026-08 (D1); leaf keyed off the local key.
    const segments = ["AVULSAS", "EC", "2026-08", "RAF-1_banner-principal"];
    const leafFolder = path.join(workspaceRoot, ...segments);
    assert.strictEqual(result.folderPath, leafFolder);
    assert.strictEqual(result.localKey, "RAF-1");
    assert.ok(existsSync(path.join(leafFolder, "editaveis", "assets")));
    // 042 D2: lowercase local key in the file; the leaf folder keeps RAF-1 (D5).
    assert.strictEqual(
      result.copiedFile,
      path.join(leafFolder, "editaveis", "ec_raf-1_banner-principal.psd"),
    );

    const manifest = parseManifest(
      JSON.parse(readFileSync(path.join(leafFolder, ".saci.json"), "utf8")),
    );
    assert.deepStrictEqual(manifest, {
      schemaVersion: 2,
      jiraKey: null,
      localKey: "RAF-1",
      vertical: "EC",
      slug: "banner-principal",
      template: "banner",
      drivePath: segments,
      history: [{ event: "start", actor: null, at: "2026-07-04T12:00:00.000Z" }],
    });

    // D7: the counter persisted as nextSeq + 1.
    assert.strictEqual(nextSeqOnDisk(identityFilePath), 2);
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
});

test("start --local with --variation appends the sanitized variacao segment (042 D2/D3)", async () => {
  const { base, workspaceRoot, identityFilePath } = makeLocalSandbox(["banner.psd"]);
  try {
    const result = await runStartLocal(
      localOptions(workspaceRoot, identityFilePath, { variation: "Stories" }),
    );
    assert.strictEqual(
      result.copiedFile,
      path.join(
        workspaceRoot,
        "AVULSAS",
        "EC",
        "2026-07",
        "RAF-1_banner-principal",
        "editaveis",
        "ec_raf-1_banner-principal_stories.psd",
      ),
    );
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
});

test("start --local without --due files under the start-timestamp month (D9)", async () => {
  const { base, workspaceRoot, identityFilePath } = makeLocalSandbox([]);
  try {
    // FIXED_NOW is 2026-07-04 → month 2026-07 via started_at (an unparseable
    // --due never reaches this layer — rejected at the parser, amended D11).
    const result = await runStartLocal(
      localOptions(workspaceRoot, identityFilePath, { blank: true }),
    );
    assert.strictEqual(
      result.folderPath,
      path.join(workspaceRoot, "AVULSAS", "EC", "2026-07", "RAF-1_banner-principal"),
    );
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
});

test("a validation failure before the persist point consumes no sequence number (P2)", async () => {
  const { base, workspaceRoot, identityFilePath } = makeLocalSandbox(["banner.psd"]);
  try {
    // Pre-create the derived leaf folder: the collision check must fire.
    const leafFolder = path.join(workspaceRoot, "AVULSAS", "EC", "2026-07", "RAF-1_banner-principal");
    mkdirSync(leafFolder, { recursive: true });

    await assert.rejects(
      runStartLocal(localOptions(workspaceRoot, identityFilePath)),
      /already exists/,
    );

    assert.strictEqual(nextSeqOnDisk(identityFilePath), 1);
    assert.ok(!existsSync(path.join(leafFolder, ".saci.json")));
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
});

test("a counter-persist failure leaves the workspace untouched (P2 ordering)", async () => {
  const { base, workspaceRoot, identityFilePath } = makeLocalSandbox(["banner.psd"]);
  try {
    // Read-only identity file: the P2 persist step itself fails, after every
    // validation and before any workspace write — so nothing may exist under
    // the workspace root afterwards.
    chmodSync(identityFilePath, 0o444);

    await assert.rejects(runStartLocal(localOptions(workspaceRoot, identityFilePath)));

    assert.ok(!existsSync(path.join(workspaceRoot, "AVULSAS")));
  } finally {
    chmodSync(identityFilePath, 0o666);
    rmSync(base, { recursive: true, force: true });
  }
});

test("a crash mid-scaffold burns the number; the next run mints the NEXT one (P2)", async () => {
  const { base, workspaceRoot, identityFilePath } = makeLocalSandbox(["banner.psd"]);
  try {
    // toISOString is hit once for started_at (pre-validation) and once at
    // manifest assembly (post-persist, after the dirs exist) — throwing on the
    // second call simulates a crash mid-scaffold. Coupled to that call count
    // on purpose: it pins the persist-before-mutate ordering.
    class CrashingClock extends Date {
      private calls = 0;
      override toISOString(): string {
        this.calls += 1;
        if (this.calls > 1) {
          throw new Error("simulated crash mid-scaffold");
        }
        return super.toISOString();
      }
    }

    await assert.rejects(
      runStartLocal(
        localOptions(workspaceRoot, identityFilePath, {
          now: new CrashingClock("2026-07-04T12:00:00Z"),
        }),
      ),
      /simulated crash mid-scaffold/,
    );

    // The number burned (gap, accepted per 035-D2)…
    assert.strictEqual(nextSeqOnDisk(identityFilePath), 2);

    // …and a healthy re-run mints RAF-2 — never a reuse, no collision fired.
    const result = await runStartLocal(localOptions(workspaceRoot, identityFilePath));
    assert.strictEqual(result.localKey, "RAF-2");
    assert.strictEqual(nextSeqOnDisk(identityFilePath), 3);
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
});

test("start fails loud on a bad template source and scaffolds nothing (P4)", async () => {
  // Two files in templates/EC/ → not exactly one → fail before any write.
  const { base, workspaceRoot } = makeSandbox(["a.psd", "b.psd"]);
  try {
    await assert.rejects(
      runStart(
        fakeMakeGateway(sampleIssue()),
        "MCA-101",
        workspaceRoot,
        undefined,
        false,
        undefined,
        FIXED_NOW,
      ),
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
