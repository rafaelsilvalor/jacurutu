#!/usr/bin/env node
// Composition root + shell for the `saci` CLI (brief 026, D-a3/D-a4/D-a5).
// The pure parser (`argv.ts`) maps argv to a `ParsedCommand`; this file owns all
// I/O and process control: read env credentials, construct the JiraGateway,
// dispatch to the run* composition functions, print one result line, set exit
// codes. The adapter is imported only here (R25: cli is the composition root).

import pkg from "../package.json" with { type: "json" };

import { JiraGateway, type ResolvedFieldMapping } from "@saci/adapter-jira";

import { parseArgv, type ParsedCommand } from "./argv.js";
import { loadFieldMapping } from "./field-config.js";
import { runFetch, type MakeGateway } from "./run-fetch.js";
import { runExport } from "./run-export.js";
import { renderFetch, renderExport } from "./display.js";

/** Credential env vars read by the fetch composition root (D-a3). */
const ENV_BASE_URL = "SACI_JIRA_BASE_URL";
const ENV_EMAIL = "SACI_JIRA_EMAIL";
const ENV_API_TOKEN = "SACI_JIRA_API_TOKEN";

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
    throw new Error(
      `Missing required env: ${ENV_BASE_URL}, ${ENV_EMAIL}, ${ENV_API_TOKEN} must all be set.`,
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
      const payload = await runFetch(makeGateway, command.out);
      process.stdout.write(renderFetch(payload, command.out));
      return;
    }
    case "export": {
      const result = await runExport(command.payload, command.config, command.profile);
      process.stdout.write(renderExport(result));
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
    // pkg.version reflects the internal @saci/cli version (0.0.0 per D5
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
    process.exit(EXIT_OK);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`${message}\n`);
    process.exit(EXIT_RUNTIME);
  }
}

await main();
