import { test } from "node:test";
import assert from "node:assert";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import type { Issue, Payload } from "@saci/core";

import { runExport, type ExportConfig } from "./run-export.js";

// Built from a char code so the byte under test is visible in the source
// (a literal U+FEFF is invisible and easy to strip accidentally).
const BOM = String.fromCharCode(0xfeff);

function sampleIssue(key: string, overrides: Partial<Issue> = {}): Issue {
  return {
    key,
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

function samplePayload(issues: Issue[]): Payload {
  return {
    schema_version: "2.0",
    run_date: "2026-06-05",
    generated_at: "2026-06-05T12:25:43-03:00",
    issues,
    filtered_out: [],
    warnings: [],
  };
}

/** Write payload + config fixtures into `dir`; returns the two paths. */
function writeFixtures(
  dir: string,
  payload: Payload,
  config: ExportConfig,
): { payloadPath: string; configPath: string } {
  const payloadPath = path.join(dir, "payload.json");
  const configPath = path.join(dir, "export-config.json");
  writeFileSync(payloadPath, JSON.stringify(payload), "utf8");
  writeFileSync(configPath, JSON.stringify(config), "utf8");
  return { payloadPath, configPath };
}

test("runExport writes CSV with BOM, RFC 4180 quoting, and CRLF endings", async () => {
  const dir = mkdtempSync(path.join(tmpdir(), "saci-runexport-"));
  try {
    const payload = samplePayload([
      sampleIssue("MCA-100", { summary: "Banner; principal" }),
      sampleIssue("MCA-101", { summary: 'Diz "oi"\nsegunda linha' }),
    ]);
    const config: ExportConfig = {
      profiles: {
        basic: {
          format: "csv",
          columns: ["key", { id: "summary", rename: "Resumo" }],
          output: "out.csv",
        },
      },
    };
    const { payloadPath, configPath } = writeFixtures(dir, payload, config);

    const result = await runExport(payloadPath, configPath, "basic");

    // Relative `output` resolves against the config file's directory.
    assert.strictEqual(result.outputPath, path.join(dir, "out.csv"));
    assert.strictEqual(result.format, "csv");
    assert.strictEqual(result.rowCount, 2);

    // Byte-level: BOM prefix (default on), ";" delimiter, a field containing
    // the delimiter is quoted, inner quotes doubled, LF inside a quoted field
    // preserved, every record terminated by CRLF.
    const written = readFileSync(result.outputPath, "utf8");
    assert.strictEqual(
      written,
      BOM +
        "key;Resumo\r\n" +
        'MCA-100;"Banner; principal"\r\n' +
        'MCA-101;"Diz ""oi""\nsegunda linha"\r\n',
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("runExport honors csv delimiter and includeBom options", async () => {
  const dir = mkdtempSync(path.join(tmpdir(), "saci-runexport-"));
  try {
    const payload = samplePayload([
      sampleIssue("MCA-100", { summary: "a,b" }),
      sampleIssue("MCA-101", { summary: "a;b" }),
    ]);
    const config: ExportConfig = {
      profiles: {
        comma: {
          format: "csv",
          columns: ["key", "summary"],
          csv: { delimiter: ",", includeBom: false },
          output: "out.csv",
        },
      },
    };
    const { payloadPath, configPath } = writeFixtures(dir, payload, config);

    const result = await runExport(payloadPath, configPath, "comma");

    // No BOM; quoting follows the CONFIGURED delimiter: "a,b" is quoted,
    // "a;b" passes through verbatim under a "," delimiter.
    const written = readFileSync(result.outputPath, "utf8");
    assert.strictEqual(
      written,
      "key,summary\r\n" + 'MCA-100,"a,b"\r\n' + "MCA-101,a;b\r\n",
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("runExport writes a JSON array keyed by output headers in profile order", async () => {
  const dir = mkdtempSync(path.join(tmpdir(), "saci-runexport-"));
  try {
    const payload = samplePayload([sampleIssue("MCA-100")]);
    const config: ExportConfig = {
      operator: "Rafael",
      // Trailing slash exercises the core jiraBrowseUrl normalization.
      jiraBaseUrl: "https://jira.example.com/",
      profiles: {
        report: {
          format: "json",
          columns: [{ id: "entrega_iso", rename: "data" }, "key", "task_filha_url", "operator"],
          output: "out.json",
        },
      },
    };
    const { payloadPath, configPath } = writeFixtures(dir, payload, config);

    const result = await runExport(payloadPath, configPath, "report");
    assert.strictEqual(result.format, "json");
    assert.strictEqual(result.rowCount, 1);

    // Exact bytes: indent=2, keys are the OUTPUT headers in profile order
    // (rename applied), no trailing newline (run-fetch precedent).
    const written = readFileSync(result.outputPath, "utf8");
    const expected = [
      {
        data: "2026-06-10",
        key: "MCA-100",
        task_filha_url: "https://jira.example.com/browse/MCA-100",
        operator: "Rafael",
      },
    ];
    assert.strictEqual(written, JSON.stringify(expected, null, 2));
    assert.ok(!written.endsWith("\n"), "JSON output must not end with a newline");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("runExport default profile without filters exports one row per issue", async () => {
  const dir = mkdtempSync(path.join(tmpdir(), "saci-runexport-"));
  try {
    const payload = samplePayload([
      sampleIssue("MCA-100"),
      sampleIssue("MCA-101", { status_jira: "BACKLOG" }),
      sampleIssue("MCA-102", { entrega_iso: null }),
    ]);
    // No operator on the config root: the operator column projects to "" (D8).
    const config: ExportConfig = {
      profiles: {
        all: { format: "json", columns: ["key", "operator"], output: "all.json" },
      },
    };
    const { payloadPath, configPath } = writeFixtures(dir, payload, config);

    const result = await runExport(payloadPath, configPath, "all");
    assert.strictEqual(result.rowCount, 3);

    const rows = JSON.parse(readFileSync(result.outputPath, "utf8")) as Array<
      Record<string, string>
    >;
    assert.deepStrictEqual(
      rows.map((r) => r["key"]),
      ["MCA-100", "MCA-101", "MCA-102"],
    );
    assert.ok(
      rows.every((r) => r["operator"] === ""),
      'operator must default to "" when absent from the config root',
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("runExport applies status and entrega filters from the profile", async () => {
  const dir = mkdtempSync(path.join(tmpdir(), "saci-runexport-"));
  try {
    const payload = samplePayload([
      // Kept: status matches; entrega 2026-06-10 sits ON the inclusive `from`.
      sampleIssue("MCA-200"),
      // Kept: status differs only by case; entrega 2026-06-11 sits ON the inclusive `to`.
      sampleIssue("MCA-201", {
        status_jira: "fila de execucao",
        entrega_iso: "2026-06-11T10:30:00.000-0300",
      }),
      // Dropped: status not in the filter set.
      sampleIssue("MCA-202", { status_jira: "BACKLOG" }),
      // Dropped: entrega beyond the inclusive `to`.
      sampleIssue("MCA-203", { entrega_iso: "2026-06-12T09:00:00.000-0300" }),
      // Dropped: null entrega cannot satisfy a window.
      sampleIssue("MCA-204", { entrega_iso: null }),
    ]);
    const config: ExportConfig = {
      profiles: {
        window: {
          format: "json",
          columns: ["key"],
          // Untrimmed, differently-cased filter value: matching is
          // case-insensitive and trimmed on both sides.
          filters: {
            status: ["  Fila de Execucao  "],
            entrega: { from: "2026-06-10", to: "2026-06-11" },
          },
          output: "window.json",
        },
      },
    };
    const { payloadPath, configPath } = writeFixtures(dir, payload, config);

    const result = await runExport(payloadPath, configPath, "window");
    assert.strictEqual(result.rowCount, 2);

    const rows = JSON.parse(readFileSync(result.outputPath, "utf8")) as Array<
      Record<string, string>
    >;
    assert.deepStrictEqual(
      rows.map((r) => r["key"]),
      ["MCA-200", "MCA-201"],
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("runExport overwrites the stable output path on a second run", async () => {
  const dir = mkdtempSync(path.join(tmpdir(), "saci-runexport-"));
  try {
    const config: ExportConfig = {
      profiles: {
        all: { format: "json", columns: ["key"], output: "stable.json" },
      },
    };
    const first = samplePayload([sampleIssue("MCA-100"), sampleIssue("MCA-101")]);
    const { payloadPath, configPath } = writeFixtures(dir, first, config);
    await runExport(payloadPath, configPath, "all");

    const second = samplePayload([sampleIssue("MCA-300")]);
    writeFileSync(payloadPath, JSON.stringify(second), "utf8");
    const result = await runExport(payloadPath, configPath, "all");

    assert.strictEqual(result.rowCount, 1);
    const rows = JSON.parse(readFileSync(result.outputPath, "utf8")) as Array<
      Record<string, string>
    >;
    // Only the second run's row remains: the file was overwritten, not appended.
    assert.deepStrictEqual(
      rows.map((r) => r["key"]),
      ["MCA-300"],
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("runExport throws on an unknown profile name", async () => {
  const dir = mkdtempSync(path.join(tmpdir(), "saci-runexport-"));
  try {
    const payload = samplePayload([sampleIssue("MCA-100")]);
    const config: ExportConfig = {
      profiles: {
        all: { format: "json", columns: ["key"], output: "all.json" },
      },
    };
    const { payloadPath, configPath } = writeFixtures(dir, payload, config);

    await assert.rejects(
      () => runExport(payloadPath, configPath, "nope"),
      /Unknown export profile: "nope"/,
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
