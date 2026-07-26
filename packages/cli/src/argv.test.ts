import { test } from "node:test";
import assert from "node:assert";

import { parseArgv, DEFAULT_OUT } from "./argv.js";

// All cases drive the PUBLIC surface (`parseArgv`) per D-a6. No I/O: argv is a
// plain string[] and the parser is pure, so these run with no env/fs/network.

test("fetch with --jql parses jql and defaults out to DEFAULT_OUT", () => {
  const result = parseArgv(["fetch", "--jql", "project = MCA"]);
  // No mapping flags: fieldConfig/project are undefined (default-mapping path).
  assert.deepStrictEqual(result, {
    kind: "fetch",
    jql: "project = MCA",
    out: DEFAULT_OUT,
    fieldConfig: undefined,
    project: undefined,
  });
});

test("fetch with --jql and --out overrides the default out", () => {
  const result = parseArgv(["fetch", "--jql", "project = MCA", "--out", "custom.json"]);
  assert.deepStrictEqual(result, {
    kind: "fetch",
    jql: "project = MCA",
    out: "custom.json",
    fieldConfig: undefined,
    project: undefined,
  });
});

test("fetch with both --field-config and --project carries the override flags", () => {
  const result = parseArgv([
    "fetch",
    "--jql",
    "project = MCA",
    "--field-config",
    "fields.json",
    "--project",
    "MC",
  ]);
  assert.deepStrictEqual(result, {
    kind: "fetch",
    jql: "project = MCA",
    out: DEFAULT_OUT,
    fieldConfig: "fields.json",
    project: "MC",
  });
});

test("fetch with only --field-config falls back to usage (exit 2)", () => {
  const result = parseArgv(["fetch", "--jql", "project = MCA", "--field-config", "fields.json"]);
  assert.strictEqual(result.kind, "usage");
});

test("fetch with only --project falls back to usage (exit 2)", () => {
  const result = parseArgv(["fetch", "--jql", "project = MCA", "--project", "MC"]);
  assert.strictEqual(result.kind, "usage");
});

test("export with all three flags parses payload, config, profile", () => {
  const result = parseArgv([
    "export",
    "--payload",
    "payload.json",
    "--config",
    "config.json",
    "--profile",
    "looker",
  ]);
  assert.deepStrictEqual(result, {
    kind: "export",
    payload: "payload.json",
    config: "config.json",
    profile: "looker",
  });
});

test("start with <KEY> and --workspace-root parses key, root, and defaults", () => {
  const result = parseArgv(["start", "MCA-101", "--workspace-root", "/work"]);
  // No --templates-root: forwarded undefined (P1 default resolved in cli.ts).
  // No --blank / --open: default to false (040 D2: opt-in, byte-identical default).
  assert.deepStrictEqual(result, {
    kind: "start",
    key: "MCA-101",
    workspaceRoot: "/work",
    templatesRoot: undefined,
    blank: false,
    open: false,
  });
});

test("start with --blank sets blank true", () => {
  const result = parseArgv(["start", "MCA-101", "--workspace-root", "/work", "--blank"]);
  assert.strictEqual(result.kind, "start");
  assert.strictEqual((result as { blank: boolean }).blank, true);
});

test("start with --templates-root forwards it unresolved", () => {
  const result = parseArgv([
    "start",
    "MCA-101",
    "--workspace-root",
    "/work",
    "--templates-root",
    "/tpl",
  ]);
  assert.deepStrictEqual(result, {
    kind: "start",
    key: "MCA-101",
    workspaceRoot: "/work",
    templatesRoot: "/tpl",
    blank: false,
    open: false,
  });
});

test("start with --open sets open true (040 D2)", () => {
  const result = parseArgv(["start", "MCA-101", "--workspace-root", "/work", "--open"]);
  assert.strictEqual(result.kind, "start");
  assert.strictEqual((result as { open: boolean }).open, true);
});

test("start missing <KEY> falls back to usage", () => {
  const result = parseArgv(["start", "--workspace-root", "/work"]);
  assert.strictEqual(result.kind, "usage");
});

test("start uppercases a lowercase key before use (D3)", () => {
  const result = parseArgv(["start", "mca-101", "--workspace-root", "/work"]);
  assert.strictEqual(result.kind, "start");
  assert.strictEqual((result as { key: string }).key, "MCA-101");
});

test("start --local with all flags parses the start-local variant", () => {
  const result = parseArgv([
    "start",
    "--local",
    "--vertical",
    "EC",
    "--title",
    "Banner principal",
    "--workspace-root",
    "/work",
    "--due",
    "2026-08-15",
    "--templates-root",
    "/tpl",
    "--blank",
  ]);
  assert.deepStrictEqual(result, {
    kind: "start-local",
    vertical: "EC",
    title: "Banner principal",
    due: "2026-08-15",
    workspaceRoot: "/work",
    templatesRoot: "/tpl",
    blank: true,
    open: false,
  });
});

test("start --local with --open sets open true (040 D2)", () => {
  const result = parseArgv([
    "start",
    "--local",
    "--vertical",
    "EC",
    "--title",
    "Banner principal",
    "--workspace-root",
    "/work",
    "--open",
  ]);
  assert.strictEqual(result.kind, "start-local");
  assert.strictEqual((result as { open: boolean }).open, true);
});

test("start --local without optional flags defaults due/templatesRoot/blank", () => {
  const result = parseArgv([
    "start",
    "--local",
    "--vertical",
    "EC",
    "--title",
    "Banner principal",
    "--workspace-root",
    "/work",
  ]);
  assert.deepStrictEqual(result, {
    kind: "start-local",
    vertical: "EC",
    title: "Banner principal",
    due: undefined,
    workspaceRoot: "/work",
    templatesRoot: undefined,
    blank: false,
    open: false,
  });
});

test("start --local with a positional <KEY> falls back to usage (D1)", () => {
  const result = parseArgv([
    "start",
    "MCA-101",
    "--local",
    "--vertical",
    "EC",
    "--title",
    "Banner",
    "--workspace-root",
    "/work",
  ]);
  assert.strictEqual(result.kind, "usage");
  assert.match((result as { message: string }).message, /cannot be combined with --local/);
});

test("start --local missing --title falls back to usage naming the flag", () => {
  const result = parseArgv(["start", "--local", "--vertical", "EC", "--workspace-root", "/work"]);
  assert.strictEqual(result.kind, "usage");
  assert.match((result as { message: string }).message, /--title/);
});

test("start --local with a whitespace-only --title falls back to usage", () => {
  const result = parseArgv([
    "start",
    "--local",
    "--vertical",
    "EC",
    "--title",
    "   ",
    "--workspace-root",
    "/work",
  ]);
  assert.strictEqual(result.kind, "usage");
  assert.match((result as { message: string }).message, /--title/);
});

test("start --local missing --vertical falls back to usage naming the flag", () => {
  const result = parseArgv(["start", "--local", "--title", "Banner", "--workspace-root", "/work"]);
  assert.strictEqual(result.kind, "usage");
  assert.match((result as { message: string }).message, /--vertical/);
});

test("start --local with an empty --vertical falls back to usage (D1)", () => {
  const result = parseArgv([
    "start",
    "--local",
    "--vertical",
    "",
    "--title",
    "Banner",
    "--workspace-root",
    "/work",
  ]);
  assert.strictEqual(result.kind, "usage");
  assert.match((result as { message: string }).message, /--vertical/);
});

test("start --local missing --workspace-root falls back to usage", () => {
  const result = parseArgv(["start", "--local", "--vertical", "EC", "--title", "Banner"]);
  assert.strictEqual(result.kind, "usage");
  assert.match((result as { message: string }).message, /--workspace-root/);
});

test("start --local with an invalid --due fails loud naming the flag (amended D11)", () => {
  const result = parseArgv([
    "start",
    "--local",
    "--vertical",
    "EC",
    "--title",
    "Banner",
    "--workspace-root",
    "/work",
    "--due",
    "15/08/2026",
  ]);
  assert.strictEqual(result.kind, "usage");
  assert.match((result as { message: string }).message, /Invalid --due value "15\/08\/2026"/);
  assert.match((result as { message: string }).message, /ISO date \(YYYY-MM-DD\)/);
});

test("start --local with a non-calendar --due fails loud (amended D11)", () => {
  const result = parseArgv([
    "start",
    "--local",
    "--vertical",
    "EC",
    "--title",
    "Banner",
    "--workspace-root",
    "/work",
    "--due",
    "2026-02-30",
  ]);
  assert.strictEqual(result.kind, "usage");
  assert.match((result as { message: string }).message, /Invalid --due value/);
});

test("start missing --workspace-root falls back to usage", () => {
  const result = parseArgv(["start", "MCA-101"]);
  assert.strictEqual(result.kind, "usage");
});

test("fetch missing required --jql falls back to usage", () => {
  const result = parseArgv(["fetch"]);
  assert.strictEqual(result.kind, "usage");
});

test("export missing a required flag falls back to usage", () => {
  const result = parseArgv(["export", "--payload", "payload.json", "--config", "config.json"]);
  assert.strictEqual(result.kind, "usage");
});

test("unknown command falls back to usage", () => {
  const result = parseArgv(["bogus"]);
  assert.strictEqual(result.kind, "usage");
});

test("unknown flag falls back to usage", () => {
  const result = parseArgv(["fetch", "--nope", "x"]);
  assert.strictEqual(result.kind, "usage");
});

test("--version yields a version result", () => {
  const result = parseArgv(["--version"]);
  assert.deepStrictEqual(result, { kind: "version" });
});

test("-v short flag yields a version result", () => {
  const result = parseArgv(["-v"]);
  assert.deepStrictEqual(result, { kind: "version" });
});
