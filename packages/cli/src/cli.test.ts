import { test } from "node:test";
import assert from "node:assert";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

// End-to-end shell tests (brief 036, decision c): spawn the COMPILED cli.js —
// these run from dist/, so cli.js is a sibling — with every JACURUTU_* env var
// scrubbed. That the local path succeeds under a scrubbed env IS the offline
// proof (constraint 4): no credentials, no gateway, no network.
const CLI_PATH = path.join(import.meta.dirname, "cli.js");

/** Exit codes under test — must mirror cli.ts (D-a4): 1 runtime, 2 usage. */
const EXIT_RUNTIME = 1;
const EXIT_USAGE = 2;

/**
 * Spawn the CLI with JACURUTU_* scrubbed and the identity file pointed at the
 * sandbox. `extraEnv` is applied after the scrub, so a test can re-introduce
 * selected JACURUTU_JIRA_* values and control exactly which ones are absent.
 */
function runCli(
  args: string[],
  identityFilePath: string,
  extraEnv?: Record<string, string>,
): { status: number | null; stdout: string; stderr: string } {
  const env: NodeJS.ProcessEnv = {};
  for (const [key, value] of Object.entries(process.env)) {
    if (!key.startsWith("JACURUTU_")) {
      env[key] = value;
    }
  }
  env.JACURUTU_IDENTITY_FILE = identityFilePath;
  Object.assign(env, extraEnv);
  const result = spawnSync(process.execPath, [CLI_PATH, ...args], { env, encoding: "utf8" });
  return { status: result.status, stdout: result.stdout, stderr: result.stderr };
}

/** Sandbox: workspace/, sibling templates/EC/banner.psd, and a seeded identity file. */
function makeSandbox(): { base: string; workspaceRoot: string; identityFilePath: string } {
  const base = mkdtempSync(path.join(tmpdir(), "jacurutu-cli-e2e-"));
  const workspaceRoot = path.join(base, "workspace");
  mkdirSync(workspaceRoot, { recursive: true });
  const verticalDir = path.join(base, "templates", "EC");
  mkdirSync(verticalDir, { recursive: true });
  writeFileSync(path.join(verticalDir, "banner.psd"), "template-bytes");
  const identityFilePath = path.join(base, "identity.json");
  writeFileSync(identityFilePath, `{\n  "prefix": "RAF",\n  "nextSeq": 1\n}\n`);
  return { base, workspaceRoot, identityFilePath };
}

test("start --local succeeds end-to-end offline (no JACURUTU_JIRA_* set)", () => {
  const { base, workspaceRoot, identityFilePath } = makeSandbox();
  try {
    const { status, stdout, stderr } = runCli(
      [
        "start",
        "--local",
        "--vertical",
        "EC",
        "--title",
        "Banner principal",
        "--workspace-root",
        workspaceRoot,
        "--due",
        "2026-08-15",
      ],
      identityFilePath,
    );

    assert.strictEqual(status, 0, `expected exit 0, got ${status}; stderr: ${stderr}`);
    assert.match(stdout, /^Local key: RAF-1\n/);
    assert.match(stdout, /Created /);

    const leafFolder = path.join(workspaceRoot, "AVULSAS", "EC", "2026-08", "RAF-1_banner-principal");
    assert.ok(existsSync(path.join(leafFolder, ".jacurutu.json")));
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
});

test("start --local with a missing identity file exits 1 with the seed guidance", () => {
  const { base, workspaceRoot } = makeSandbox();
  try {
    const missing = path.join(base, "nowhere", "identity.json");
    const { status, stderr } = runCli(
      ["start", "--local", "--vertical", "EC", "--title", "Banner", "--workspace-root", workspaceRoot],
      missing,
    );

    assert.strictEqual(status, EXIT_RUNTIME);
    assert.match(stderr, /No identity file at /);
    assert.match(stderr, /"nextSeq": 1/);
    // Fail-loud before any mutation: nothing was scaffolded.
    assert.ok(!existsSync(path.join(workspaceRoot, "AVULSAS")));
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
});

test("start with a positional <KEY> plus --local exits 2 with usage", () => {
  const { base, workspaceRoot, identityFilePath } = makeSandbox();
  try {
    const { status, stderr } = runCli(
      [
        "start",
        "MCA-101",
        "--local",
        "--vertical",
        "EC",
        "--title",
        "Banner",
        "--workspace-root",
        workspaceRoot,
      ],
      identityFilePath,
    );

    assert.strictEqual(status, EXIT_USAGE);
    assert.match(stderr, /cannot be combined with --local/);
    assert.match(stderr, /Usage:/);
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
});

// Missing-credential discrimination (brief 044, D1/D3): the env check throws
// before any gateway is constructed, so `fetch` reaches neither the network nor
// the identity file — a throwaway path suffices. Absence is asserted on FULL
// var names only: the three share the JACURUTU_JIRA_ prefix.
const UNUSED_IDENTITY_FILE = path.join(tmpdir(), "jacurutu-cli-e2e-unused-identity.json");

test("fetch with no Jira credentials set names all three env vars", () => {
  const { status, stderr } = runCli(["fetch", "--jql", "project = X"], UNUSED_IDENTITY_FILE);

  assert.strictEqual(status, EXIT_RUNTIME);
  assert.match(stderr, /Missing required env:/);
  assert.match(stderr, /JACURUTU_JIRA_BASE_URL/);
  assert.match(stderr, /JACURUTU_JIRA_EMAIL/);
  assert.match(stderr, /JACURUTU_JIRA_API_TOKEN/);
});

test("fetch with only the Jira email absent names that var alone", () => {
  const { status, stderr } = runCli(["fetch", "--jql", "project = X"], UNUSED_IDENTITY_FILE, {
    JACURUTU_JIRA_BASE_URL: "https://example.atlassian.net",
    JACURUTU_JIRA_API_TOKEN: "dummy-token",
  });

  assert.strictEqual(status, EXIT_RUNTIME);
  assert.match(stderr, /JACURUTU_JIRA_EMAIL/);
  assert.ok(!stderr.includes("JACURUTU_JIRA_BASE_URL"), `unexpected base-url name: ${stderr}`);
  assert.ok(!stderr.includes("JACURUTU_JIRA_API_TOKEN"), `unexpected api-token name: ${stderr}`);
});
