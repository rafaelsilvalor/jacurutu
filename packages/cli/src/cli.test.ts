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
//
// Since 2026-08-20 the Jira credentials come from a FILE (D2), so every spawn
// also overrides the credentials path into the sandbox. That override is not a
// convenience: without it a test would resolve the real per-user
// ~/.jacurutu/jira-credentials.json and either read a live credential or fail
// for a reason that has nothing to do with the test (constraint 3).
const CLI_PATH = path.join(import.meta.dirname, "cli.js");

/** Exit codes under test — must mirror cli.ts (D-a4): 1 runtime, 2 usage. */
const EXIT_RUNTIME = 1;
const EXIT_USAGE = 2;

/** The three env vars retired on 2026-08-20 (D2), named so their death is testable. */
const RETIRED_BASE_URL = "JACURUTU_JIRA_BASE_URL";
const RETIRED_EMAIL = "JACURUTU_JIRA_EMAIL";
const RETIRED_API_TOKEN = "JACURUTU_JIRA_API_TOKEN";

/**
 * A closed LOOPBACK port. A run that gets past credential resolution fails here,
 * at the transport, so no test reaches a host (constraint 3).
 */
const UNREACHABLE_BASE_URL = "http://127.0.0.1:1";

/**
 * Stuffed into the retired variables. Chosen so that its appearance anywhere in
 * the output would itself be the proof that an environment fallback exists.
 */
const ENV_ONLY_MARKER = "env-must-not-be-read.example.com";

/**
 * Spawn the CLI with JACURUTU_* scrubbed and BOTH per-user files pointed at the
 * sandbox. `extraEnv` is applied after the scrub, so a test can re-introduce the
 * retired JACURUTU_JIRA_* names and prove they are no longer a source of values.
 */
function runCli(
  args: string[],
  identityFilePath: string,
  credentialsFilePath: string,
  extraEnv?: Record<string, string>,
): { status: number | null; stdout: string; stderr: string } {
  const env: NodeJS.ProcessEnv = {};
  for (const [key, value] of Object.entries(process.env)) {
    if (!key.startsWith("JACURUTU_")) {
      env[key] = value;
    }
  }
  env.JACURUTU_IDENTITY_FILE = identityFilePath;
  env.JACURUTU_JIRA_CREDENTIALS_FILE = credentialsFilePath;
  Object.assign(env, extraEnv);
  const result = spawnSync(process.execPath, [CLI_PATH, ...args], { env, encoding: "utf8" });
  return { status: result.status, stdout: result.stdout, stderr: result.stderr };
}

/**
 * Sandbox: workspace/, sibling templates/EC/banner.psd, a seeded identity file,
 * and a credentials PATH deliberately left non-existent — a test that wants the
 * file present calls `seedCredentials`.
 */
function makeSandbox(): {
  base: string;
  workspaceRoot: string;
  identityFilePath: string;
  credentialsFilePath: string;
} {
  const base = mkdtempSync(path.join(tmpdir(), "jacurutu-cli-e2e-"));
  const workspaceRoot = path.join(base, "workspace");
  mkdirSync(workspaceRoot, { recursive: true });
  const verticalDir = path.join(base, "templates", "EC");
  mkdirSync(verticalDir, { recursive: true });
  writeFileSync(path.join(verticalDir, "banner.psd"), "template-bytes");
  const identityFilePath = path.join(base, "identity.json");
  writeFileSync(identityFilePath, `{\n  "prefix": "RAF",\n  "nextSeq": 1\n}\n`);
  const credentialsFilePath = path.join(base, "jira-credentials.json");
  return { base, workspaceRoot, identityFilePath, credentialsFilePath };
}

/** Seed a well-formed credentials file. Every value is a placeholder (constraint 2). */
function seedCredentials(filePath: string): void {
  const record = {
    baseUrl: UNREACHABLE_BASE_URL,
    email: "you@example.com",
    apiToken: "<a placeholder token>",
    expiresAt: "2027-08-19",
  };
  writeFileSync(filePath, `${JSON.stringify(record, null, 2)}\n`);
}

test("start --local succeeds end-to-end offline (no Jira credentials file at all)", () => {
  const { base, workspaceRoot, identityFilePath, credentialsFilePath } = makeSandbox();
  try {
    // The credentials path is SET and points at a file that does not exist:
    // start --local must not consult it, so its absence must be unreachable.
    assert.ok(!existsSync(credentialsFilePath), "the sandbox credentials file must be absent");
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
      credentialsFilePath,
    );

    assert.strictEqual(status, 0, `expected exit 0, got ${status}; stderr: ${stderr}`);
    assert.match(stdout, /^Local key: RAF-1\n/);
    assert.match(stdout, /Created /);
    assert.ok(!stderr.includes("Jira credentials"), `local path read the credentials: ${stderr}`);

    const leafFolder = path.join(workspaceRoot, "AVULSAS", "EC", "2026-08", "RAF-1_banner-principal");
    assert.ok(existsSync(path.join(leafFolder, ".jacurutu.json")));
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
});

test("start --local with a missing identity file exits 1 with the seed guidance", () => {
  const { base, workspaceRoot, credentialsFilePath } = makeSandbox();
  try {
    const missing = path.join(base, "nowhere", "identity.json");
    const { status, stderr } = runCli(
      ["start", "--local", "--vertical", "EC", "--title", "Banner", "--workspace-root", workspaceRoot],
      missing,
      credentialsFilePath,
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
  const { base, workspaceRoot, identityFilePath, credentialsFilePath } = makeSandbox();
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
      credentialsFilePath,
    );

    assert.strictEqual(status, EXIT_USAGE);
    assert.match(stderr, /cannot be combined with --local/);
    assert.match(stderr, /Usage:/);
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
});

// Credential resolution (D2). These three replace the two brief-044 tests, whose
// subject — per-variable discrimination across three env vars — no longer
// exists. The principle they defended did not vanish: it moved inward, to
// per-FIELD narrowing inside the file, and outward, to naming a retired variable
// that a shell still exports. Absence is asserted on FULL var names, because the
// three share the JACURUTU_JIRA_ prefix with the path override every spawn sets.

test("fetch with no credentials file exits 1 naming the absolute path", () => {
  const { base, identityFilePath, credentialsFilePath } = makeSandbox();
  try {
    const { status, stderr } = runCli(
      ["fetch", "--jql", "project = X", "--out", path.join(base, "payload.json")],
      identityFilePath,
      credentialsFilePath,
    );

    assert.strictEqual(status, EXIT_RUNTIME);
    assert.ok(
      stderr.includes(`No Jira credentials file at ${credentialsFilePath}`),
      `expected the absolute path, got: ${stderr}`,
    );
    // The seed the operator is meant to copy, checked field by field.
    assert.match(stderr, /"baseUrl"/);
    assert.match(stderr, /"email"/);
    assert.match(stderr, /"apiToken"/);
    assert.match(stderr, /"expiresAt"/);
    // Nothing was exported, so nothing is named as retired.
    assert.ok(!stderr.includes("no longer read"), `unexpected migration line: ${stderr}`);
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
});

test("fetch with no credentials file and all three retired vars set names those three", () => {
  const { base, identityFilePath, credentialsFilePath } = makeSandbox();
  try {
    const { status, stderr } = runCli(
      ["fetch", "--jql", "project = X", "--out", path.join(base, "payload.json")],
      identityFilePath,
      credentialsFilePath,
      {
        [RETIRED_BASE_URL]: `https://${ENV_ONLY_MARKER}`,
        [RETIRED_EMAIL]: `someone@${ENV_ONLY_MARKER}`,
        [RETIRED_API_TOKEN]: "<a different placeholder token>",
      },
    );

    // The decisive assertion for D2: three complete credentials sit in the
    // environment and the run STILL fails on the missing file. A fallback of
    // any precedence would have carried it past this point.
    assert.strictEqual(status, EXIT_RUNTIME);
    assert.ok(stderr.includes(`No Jira credentials file at ${credentialsFilePath}`));
    assert.ok(stderr.includes(RETIRED_BASE_URL), `did not name the base-url var: ${stderr}`);
    assert.ok(stderr.includes(RETIRED_EMAIL), `did not name the email var: ${stderr}`);
    assert.ok(stderr.includes(RETIRED_API_TOKEN), `did not name the api-token var: ${stderr}`);
    assert.match(stderr, /are set but no longer read/);
    // Names only, never values (constraint 2).
    assert.ok(!stderr.includes(ENV_ONLY_MARKER), `leaked a retired value: ${stderr}`);
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
});

test("fetch with a seeded file ignores three retired vars holding other values (D2)", () => {
  const { base, identityFilePath, credentialsFilePath } = makeSandbox();
  try {
    seedCredentials(credentialsFilePath);
    const { status, stderr } = runCli(
      ["fetch", "--jql", "project = X", "--out", path.join(base, "payload.json")],
      identityFilePath,
      credentialsFilePath,
      {
        [RETIRED_BASE_URL]: `https://${ENV_ONLY_MARKER}`,
        [RETIRED_EMAIL]: `someone@${ENV_ONLY_MARKER}`,
        [RETIRED_API_TOKEN]: "<a different placeholder token>",
      },
    );

    // Resolution passed the file stage: the run fails LATER, at the transport,
    // and never with a credential-resolution error.
    assert.strictEqual(status, EXIT_RUNTIME);
    assert.ok(!stderr.includes("No Jira credentials file at"), `failed on the file: ${stderr}`);
    assert.ok(!stderr.includes("must be a non-empty string"), `failed on a field: ${stderr}`);
    assert.ok(!stderr.includes("must hold a JSON object"), `failed on the shape: ${stderr}`);
    assert.ok(!stderr.includes("no longer read"), `emitted the migration line: ${stderr}`);
    assert.ok(!stderr.includes(ENV_ONLY_MARKER), `read a value from the environment: ${stderr}`);
    assert.ok(stderr.trim().length > 0, "the run must fail somewhere, and say so");
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
});
