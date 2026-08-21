#!/usr/bin/env node
// Composition root + shell for the `jacurutu` CLI (brief 026, D-a3/D-a4/D-a5).
// The pure parser (`argv.ts`) maps argv to a `ParsedCommand`; this file owns all
// I/O and process control: read the credentials file, construct the JiraGateway,
// dispatch to the run* composition functions, print one result line, set exit
// codes. The adapter is imported only here (R25: cli is the composition root).

import os from "node:os";
import path from "node:path";

import pkg from "../package.json" with { type: "json" };

import { JiraGateway, type ResolvedFieldMapping } from "@jacurutu/adapter-jira";
import { createSpreadsheetGateway } from "@jacurutu/adapter-sheets";

import { parseArgv, type ParsedCommand } from "./argv.js";
import { loadFieldMapping } from "./field-config.js";
import { IDENTITY_DIR_NAME, IDENTITY_FILENAME } from "./identity.js";
import { JIRA_CREDENTIALS_FILENAME, readJiraCredentials } from "./jira-credentials.js";
import { openPath } from "./open-path.js";
import { REPORT_STATE_FILENAME } from "./report-state.js";
import { runFetch, type MakeGateway } from "./run-fetch.js";
import { runExport } from "./run-export.js";
import { runReport } from "./run-report.js";
import { runStart, runStartLocal, type StartLocalOptions } from "./run-start.js";
import { renderFetch, renderExport, renderReport, renderStart } from "./display.js";

/** Identity-file override env var (brief 036, P1); same env-not-flag precedent as D-a3. */
const ENV_IDENTITY_FILE = "JACURUTU_IDENTITY_FILE";
/** Jira-credentials-file override env var (D6). Carries a PATH, never a credential. */
const ENV_JIRA_CREDENTIALS_FILE = "JACURUTU_JIRA_CREDENTIALS_FILE";

/** Exit codes (D-a4): success / runtime-IO-network / usage. */
const EXIT_OK = 0;
const EXIT_RUNTIME = 1;
const EXIT_USAGE = 2;

/**
 * Resolve the Jira credentials from the ONE file that holds them (D2) and build
 * the gateway factory. There is NO environment fallback and no precedence rule:
 * two sources would restore the failure brief 044 was written about — an
 * operator reading a value that is not the one being used — and would make every
 * credential error ambiguous about which source it is complaining about. A
 * missing, malformed or incomplete file throws from the reader, naming the
 * absolute path and the fix, and main()'s catch reports it at EXIT_RUNTIME
 * (D-a4 boundary clause). `process.env` is passed for ONE purpose: so the
 * missing-file message can name retired variables the shell still exports.
 * `fieldMapping` is passed only when an override was loaded (029 D6); when
 * omitted the adapter's DEFAULT_FIELD_MAPPING applies — the unconfigured path.
 */
async function makeGatewayFactory(
  jql: string,
  fieldMapping?: ResolvedFieldMapping,
): Promise<MakeGateway> {
  const { baseUrl, email, apiToken, expiresAt } = await readJiraCredentials(
    resolveJiraCredentialsPath(),
    process.env,
  );

  return (dropLog, warningLog) =>
    new JiraGateway({
      baseUrl,
      email,
      apiToken,
      // Opaque to the adapter (D4): it concatenates this into the 401 and
      // never parses or compares it. The file and the calendar stay here.
      credentialExpiry: expiresAt,
      mainJql: jql,
      ...(fieldMapping ? { fieldMapping } : {}),
      dropLog,
      warningLog,
    });
}

/**
 * Resolve the identity-file path (P1): a non-empty JACURUTU_IDENTITY_FILE wins
 * (absolute or cwd-relative, resolved here — env is a shell concern, never the
 * parser's, D-a3 precedent); else the per-user default composed from the
 * identity.ts constants (R1: os.homedir() + path.join, no hardcoded root).
 */
function resolveIdentityFilePath(): string {
  const override = process.env[ENV_IDENTITY_FILE];
  if (override) {
    return path.resolve(override);
  }
  return path.join(os.homedir(), IDENTITY_DIR_NAME, IDENTITY_FILENAME);
}

/**
 * Resolve the Jira credentials file path (D6), mirroring resolveIdentityFilePath:
 * a non-empty JACURUTU_JIRA_CREDENTIALS_FILE wins, resolved here; else the
 * per-user default composed from the jira-credentials.ts constant (R1). The
 * variable carries a PATH and never a credential — a credential in an
 * environment variable is precisely what this task removed. jira-credentials.ts
 * composes no path of its own, so this is the only place that decides where the
 * file lives.
 */
function resolveJiraCredentialsPath(): string {
  const override = process.env[ENV_JIRA_CREDENTIALS_FILE];
  if (override) {
    return path.resolve(override);
  }
  return path.join(os.homedir(), IDENTITY_DIR_NAME, JIRA_CREDENTIALS_FILENAME);
}

/**
 * Resolve the report-state file path: beside the identity file, under the same
 * per-user `.jacurutu` dir, composed with os.homedir() + path.join (R1). report-state.ts
 * itself composes no path and reads no env — this is the only place that decides
 * where the file lives.
 */
function resolveReportStatePath(): string {
  return path.join(os.homedir(), IDENTITY_DIR_NAME, REPORT_STATE_FILENAME);
}

/** Map the parsed start-local command to runStartLocal options (identity path resolved here). */
function toStartLocalOptions(
  command: Extract<ParsedCommand, { kind: "start-local" }>,
): StartLocalOptions {
  return {
    identityFilePath: resolveIdentityFilePath(),
    vertical: command.vertical,
    title: command.title,
    due: command.due,
    workspaceRoot: command.workspaceRoot,
    templatesRoot: command.templatesRoot,
    variation: command.variation,
    blank: command.blank,
  };
}

/**
 * Execute the fetch/export commands. Kept off the synchronous version/usage
 * paths so those resolve without entering the async/try-catch frame. A throw
 * from the run* functions (or the env check) propagates to main()'s catch,
 * which reports it to stderr (R4: handled, never silently swallowed).
 */
async function runCommand(command: ParsedCommand): Promise<void> {
  switch (command.kind) {
    case "fetch": {
      // Override mode (029 D8): both flags present -> load the per-project
      // mapping and thread it through; otherwise the default mapping applies.
      const mapping =
        command.fieldConfig && command.project
          ? await loadFieldMapping(command.fieldConfig, command.project)
          : undefined;
      const makeGateway = await makeGatewayFactory(command.jql, mapping);
      const payload = await runFetch(makeGateway, command.out, new Date(), command.allowEmpty);
      process.stdout.write(renderFetch(payload, command.out));
      return;
    }
    case "export": {
      const result = await runExport(command.payload, command.config, command.profile);
      process.stdout.write(renderExport(result));
      return;
    }
    case "report": {
      // The factory authorizes (browser on first use, cached token after) and is
      // called here and nowhere else (D7). Nothing wraps it: an authorization or
      // Sheets failure already arrives named and actionable from the adapter, and
      // main()'s catch reports it at EXIT_RUNTIME. A friendlier message here would
      // only hide which of the two layers failed.
      const result = await runReport(() => createSpreadsheetGateway(), {
        payloadPath: command.payload,
        configPath: command.config,
        profileName: command.profile,
        statePath: resolveReportStatePath(),
        shareWith: command.shareWith,
      });
      process.stdout.write(renderReport(result));
      return;
    }
    case "start": {
      // P5: fetchIssueByKey builds its own `key = <KEY>` JQL, so the gateway's
      // mainJql is unused on the start path — construct it empty.
      const makeGateway = await makeGatewayFactory("");
      const result = await runStart(
        makeGateway,
        command.key,
        command.workspaceRoot,
        command.templatesRoot,
        command.blank,
        command.variation,
      );
      process.stdout.write(renderStart(result));
      if (command.open) {
        // D3: template path opens the copied editable; --blank opens editaveis/.
        // Only reached after a fully successful scaffold — a throw above
        // bypasses this into main()'s catch (D5).
        openPath(result.copiedFile ?? result.editablePath);
      }
      return;
    }
    case "start-local": {
      // Fully offline (brief 036, constraint 4): no gateway construction and
      // no credentials file read on this path — the identity file is the only
      // state consulted.
      const result = await runStartLocal(toStartLocalOptions(command));
      process.stdout.write(renderStart(result));
      if (command.open) {
        // D3, same success-only gate as the Jira-born route above.
        openPath(result.copiedFile ?? result.editablePath);
      }
      return;
    }
    // version/usage are handled synchronously in main() before this runs.
    default:
      return;
  }
}

async function main(): Promise<void> {
  const command = parseArgv(process.argv.slice(2));

  if (command.kind === "version") {
    // pkg.version reflects the internal @jacurutu/cli version (0.0.0 per D5
    // versioning defer); product versions live in git tags until Phase 4.
    process.stdout.write(`${pkg.version}\n`);
    process.exit(EXIT_OK);
  }

  if (command.kind === "usage") {
    process.stderr.write(`${command.message}\n`);
    process.exit(EXIT_USAGE);
  }

  try {
    await runCommand(command);
    process.exitCode = EXIT_OK;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`${message}\n`);
    process.exitCode = EXIT_RUNTIME;
  }
}

await main();
