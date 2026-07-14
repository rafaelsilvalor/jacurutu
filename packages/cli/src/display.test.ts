import { test } from "node:test";
import assert from "node:assert";

import type { Issue, Payload } from "@saci/core";

import { renderFetch, renderExport, renderStart, EMPTY_CELL, EMPTY_STATE } from "./display.js";
import type { ExportRunResult } from "./run-export.js";
import type { StartRunResult } from "./run-start.js";

// All cases drive the PUBLIC surface (renderFetch / renderExport). The module
// is pure (D3): no env, fs, network, or clock, so these run with no I/O.

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

function samplePayload(issues: Issue[], overrides: Partial<Payload> = {}): Payload {
  return {
    schema_version: "2.0",
    run_date: "2026-06-19",
    generated_at: "2026-06-19T10:00:00-03:00",
    issues,
    filtered_out: [],
    warnings: [],
    ...overrides,
  };
}

test("fetch renders a header, aligned rows, and a summary with count and path", () => {
  const payload = samplePayload([
    sampleIssue("MCA-1", { parent_summary: "Concurso PF" }),
    sampleIssue("MCA-200", { parent_summary: "Concurso PRF 2026" }),
  ]);

  const out = renderFetch(payload, "out/payload.json");
  const lines = out.trimEnd().split("\n");

  // Header line first, two issue lines, then the summary.
  assert.match(lines[0], /^KEY\s+STATUS\s+DELIVERY\s+SUMMARY$/);
  assert.ok(lines[1].startsWith("MCA-1   ")); // padded to the wider "MCA-200"
  assert.ok(lines[2].startsWith("MCA-200 "));
  assert.strictEqual(lines[lines.length - 1], "2 issues → out/payload.json");
});

test("fetch column widths equal the widest rendered cell per column", () => {
  const payload = samplePayload([sampleIssue("MCA-1"), sampleIssue("MCA-200")]);
  const lines = renderFetch(payload, "out.json").trimEnd().split("\n");

  // The KEY column width is max("KEY", "MCA-1", "MCA-200") = 7, so the second
  // column starts at the same offset on every row.
  const offsets = lines.slice(0, 3).map((line) => line.indexOf("FILA DE EXECUCAO"));
  assert.strictEqual(offsets[1], offsets[2]);
});

test("fetch on an empty payload renders the empty-state line, not a bare count", () => {
  const out = renderFetch(samplePayload([]), "out/payload.json");
  const lines = out.trimEnd().split("\n");

  assert.strictEqual(lines[0], EMPTY_STATE);
  assert.strictEqual(lines[1], "0 issues → out/payload.json");
  assert.ok(!out.includes("wrote 0 issues"));
});

test("fetch summary surfaces non-zero filtered_out and warnings counts", () => {
  const payload = samplePayload([sampleIssue("MCA-1")], {
    filtered_out: [
      { key: "MCA-9", reason: "Backlog" },
      { key: "MCA-10", reason: "Template" },
    ],
    warnings: [{ key: "MCA-1", field: "entrega_iso", issue: "unparseable date" }],
  });

  const summary = renderFetch(payload, "out.json").trimEnd().split("\n").pop();
  assert.strictEqual(summary, "1 issues, 2 filtered out, 1 warnings → out.json");
});

test("fetch renders the placeholder for a null entrega_iso, never the literal null", () => {
  const payload = samplePayload([sampleIssue("MCA-1", { entrega_iso: null })]);
  const out = renderFetch(payload, "out.json");

  assert.ok(out.includes(EMPTY_CELL));
  assert.ok(!/\bnull\b/.test(out));
});

test("export confirmation renders rowCount, outputPath, and format", () => {
  const result: ExportRunResult = {
    outputPath: "out/looker.csv",
    format: "csv",
    rowCount: 42,
  };
  assert.strictEqual(renderExport(result), "wrote 42 rows to out/looker.csv (csv)\n");
});

test("export confirmation states rowCount 0 explicitly", () => {
  const result: ExportRunResult = {
    outputPath: "out/looker.json",
    format: "json",
    rowCount: 0,
  };
  assert.strictEqual(renderExport(result), "wrote 0 rows to out/looker.json (json)\n");
});

test("start with a template names folder, editable dir, and the applied template", () => {
  const result: StartRunResult = {
    folderPath: "/work/AVULSAS/EC/2026-06/MCA-101_banner",
    editablePath: "/work/AVULSAS/EC/2026-06/MCA-101_banner/editaveis",
    copiedFile: "/work/AVULSAS/EC/2026-06/MCA-101_banner/editaveis/MCA-101_banner.psd",
    localKey: null,
  };
  const out = renderStart(result);
  assert.ok(out.endsWith("\n"));
  const lines = out.trimEnd().split("\n");
  assert.strictEqual(lines[0], "Created /work/AVULSAS/EC/2026-06/MCA-101_banner");
  assert.strictEqual(lines[1], "Editables in /work/AVULSAS/EC/2026-06/MCA-101_banner/editaveis");
  assert.strictEqual(
    lines[2],
    "Template applied → /work/AVULSAS/EC/2026-06/MCA-101_banner/editaveis/MCA-101_banner.psd",
  );
});

test("start on the --blank path states no template was applied", () => {
  const result: StartRunResult = {
    folderPath: "/work/AVULSAS/EC/2026-06/MCA-101_banner",
    editablePath: "/work/AVULSAS/EC/2026-06/MCA-101_banner/editaveis",
    copiedFile: null,
    localKey: null,
  };
  const out = renderStart(result);
  assert.ok(out.endsWith("\n"));
  assert.strictEqual(out.trimEnd().split("\n").pop(), "No template applied (--blank).");
});
