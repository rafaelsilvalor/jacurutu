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
  // No --blank: defaults to false.
  assert.deepStrictEqual(result, {
    kind: "start",
    key: "MCA-101",
    workspaceRoot: "/work",
    templatesRoot: undefined,
    blank: false,
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
  });
});

test("start missing <KEY> falls back to usage", () => {
  const result = parseArgv(["start", "--workspace-root", "/work"]);
  assert.strictEqual(result.kind, "usage");
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
