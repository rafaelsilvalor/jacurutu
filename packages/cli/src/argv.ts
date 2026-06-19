// Pure argv parser/router for the `saci` CLI (brief 026, D-a1/D-a2/D-a4/D-a6).
// Maps `argv: string[]` to a discriminated `ParsedCommand` value and nothing
// else: no `process.env`, no `process.exit`, no `fs`, no network. Keeping this
// layer pure is what makes the command surface unit-testable with `node:test`
// and no I/O (D-a6). All process control and I/O live in `cli.ts` (the shell).

import { parseArgs } from "node:util";

/** Default `--out` path for `fetch` when the flag is omitted (D-a2). */
export const DEFAULT_OUT = "payload.json";

/** Usage text owned by the parser (it owns argv defaults and the usage string). */
export const USAGE = `Usage:
  saci fetch --jql <string> [--out <path>]
  saci export --payload <path> --config <path> --profile <name>
  saci --version`;

/**
 * The outcome of parsing argv. `usage` carries a stderr-bound message and maps
 * to exit 2 in the shell (D-a4); the parser is the only source of usage errors
 * because usage errors are argv-shape errors and only the parser inspects argv.
 */
export type ParsedCommand =
  | { kind: "version" }
  | { kind: "fetch"; jql: string; out: string }
  | { kind: "export"; payload: string; config: string; profile: string }
  | { kind: "usage"; message: string };

/**
 * The single union of option flags accepted by every command (R7: a policy
 * value declared once at module top). On-ramp tolerance (D-a2): one shared
 * schema means a flag irrelevant to the chosen command is accepted and ignored
 * — no per-command option schema.
 */
const CLI_OPTIONS = {
  jql: { type: "string" },
  out: { type: "string" },
  payload: { type: "string" },
  config: { type: "string" },
  profile: { type: "string" },
  version: { type: "boolean", short: "v" },
} as const;

/** The narrowed `values` shape `parseArgs(CLI_OPTIONS)` yields. */
type CliValues = {
  jql?: string;
  out?: string;
  payload?: string;
  config?: string;
  profile?: string;
  version?: boolean;
};

/**
 * Route a successful parse to a command result. `version` is handled by the
 * caller before this runs; here the command positional is switched: `fetch`
 * requires `--jql`, `export` requires all three flags, anything else (including
 * no command) falls back to `usage`.
 */
function routeCommand(values: CliValues, positionals: string[]): ParsedCommand {
  const command = positionals[0];

  switch (command) {
    case "fetch": {
      if (values.jql === undefined) {
        return { kind: "usage", message: `Missing required flag --jql for fetch.\n\n${USAGE}` };
      }
      return { kind: "fetch", jql: values.jql, out: values.out ?? DEFAULT_OUT };
    }
    case "export": {
      if (
        values.payload === undefined ||
        values.config === undefined ||
        values.profile === undefined
      ) {
        return {
          kind: "usage",
          message: `Missing required flag(s) --payload / --config / --profile for export.\n\n${USAGE}`,
        };
      }
      return {
        kind: "export",
        payload: values.payload,
        config: values.config,
        profile: values.profile,
      };
    }
    default: {
      const detail = command === undefined ? "No command given." : `Unknown command: "${command}".`;
      return { kind: "usage", message: `${detail}\n\n${USAGE}` };
    }
  }
}

/**
 * Parse argv into a `ParsedCommand`. `version` wins first; then routing is
 * delegated to `routeCommand`. An unknown flag makes `parseArgs` throw; the
 * throw is HANDLED into a usage result (R4: not silently swallowed).
 */
export function parseArgv(argv: string[]): ParsedCommand {
  let values: CliValues;
  let positionals: string[];

  try {
    const parsed = parseArgs({ args: argv, allowPositionals: true, options: CLI_OPTIONS });
    values = parsed.values;
    positionals = parsed.positionals;
  } catch (error) {
    // R4: argv-shape errors (e.g. unknown flag) become a handled usage result.
    const message = error instanceof Error ? error.message : String(error);
    return { kind: "usage", message: `${message}\n\n${USAGE}` };
  }

  if (values.version) {
    return { kind: "version" };
  }

  return routeCommand(values, positionals);
}
