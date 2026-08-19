#!/usr/bin/env node
// Composition root + shell for the `jacurutu` CLI (brief 026, D-a3/D-a4/D-a5).
// The pure parser (`argv.ts`) maps argv to a `ParsedCommand`; this file owns all
// I/O and process control: read env credentials, construct the JiraGateway,
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
import { openPath } from "./open-path.js";
import { REPORT_STATE_FILENAME } from "./report-state.js";
import { runFetch, type MakeGateway } from "./run-fetch.js";
import { runExport } from "./run-export.js";
import { runReport } from "./run-report.js";
import { runStart, runStartLocal, type StartLocalOptions } from "./run-start.js";
import { renderFetch, renderExport, renderReport, renderStart } from "./display.js";

/** Credential env vars read by the fetch composition root (D-a3). */
const ENV_BASE_URL = "JACURUTU_JIRA_BASE_URL";
const ENV_EMAIL = "JACURUTU_JIRA_EMAIL";
const ENV_API_TOKEN = "JACURUTU_JIRA_API_TOKEN";
/** Identity-file override env var (brief 036, P1); same env-not-flag precedent as D-a3. */
const ENV_IDENTITY_FILE = "JACURUTU_IDENTITY_FILE";

/** Exit codes (D-a4): success / runtime-IO-network / usage. */
const EXIT_OK = 0;
const EXIT_RUNTIME = 1;
const EXIT_USAGE = 2;

/**
 * Resolve the three Jira credentials from the environment. A missing or empty
 * value is an environment precondition failure, not an argv-shape error, so the
 * caller reports it to stderr and exits EXIT_RUNTIME (D-a4 boundary clause).
 * `fieldMapping` is passed only when an override was loaded (029 D6); when
 * omitted the adapter's DEFAULT_FIELD_MAPPING applies — the unconfigured path.
 */
function makeGatewayFactory(jql: string, fieldMapping?: ResolvedFieldMapping): MakeGateway {
  const baseUrl = process.env[ENV_BASE_URL];
  const email = process.env[ENV_EMAIL];
  const apiToken = process.env[ENV_API_TOKEN];

  if (!baseUrl || !email || !apiToken) {
    // Name only the absent vars: the blanket three-var message masked a
    // JACURUTU_JIRA_TOKEN vs JACURUTU_JIRA_API_TOKEN typo (session 033).
    const missing = [
      ...(baseUrl ? [] : [ENV_BASE_URL]),
      ...(email ? [] : [ENV_EMAIL]),
      ...(apiToken ? [] : [ENV_API_TOKEN]),
    ];
    throw new Error(
      `Missing required env: ${missing.join(", ")} ${missing.length === 1 ? "is" : "are"} not set.`,
    );
  }

  return (dropLog, warningLog) =>
    new JiraGateway({
      baseUrl,
      email,
      apiToken,
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
      const makeGateway = makeGatewayFactory(command.jql, mapping);
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
      const makeGateway = makeGatewayFactory("");
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
      // no JACURUTU_JIRA_* reads on this path — the identity file is the only
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
