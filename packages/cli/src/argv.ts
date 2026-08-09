// Pure argv parser/router for the `saci` CLI (brief 026, D-a1/D-a2/D-a4/D-a6).
// Maps `argv: string[]` to a discriminated `ParsedCommand` value and nothing
// else: no `process.env`, no `process.exit`, no `fs`, no network. Keeping this
// layer pure is what makes the command surface unit-testable with `node:test`
// and no I/O (D-a6). All process control and I/O live in `cli.ts` (the shell).

import { parseArgs } from "node:util";

import { parseEntrega } from "@saci/core";

/** Default `--out` path for `fetch` when the flag is omitted (D-a2). */
export const DEFAULT_OUT = "payload.json";

/** Usage text owned by the parser (it owns argv defaults and the usage string). */
export const USAGE = `Usage:
  saci fetch --jql <string> [--out <path>] [--allow-empty]
             [--field-config <path> --project <KEY>]
  saci export --payload <path> --config <path> --profile <name>
  saci start <KEY> --workspace-root <path> [--templates-root <path>]
             [--variation <text>] [--blank] [--open]
  saci start --local --vertical <SIGLA> --title <text> --workspace-root <path>
             [--due <ISO-date>] [--templates-root <path>] [--variation <text>]
             [--blank] [--open]
  saci --version`;

/**
 * The outcome of parsing argv. `usage` carries a stderr-bound message and maps
 * to exit 2 in the shell (D-a4); the parser is the only source of usage errors
 * because usage errors are argv-shape errors and only the parser inspects argv.
 */
export type ParsedCommand =
  | { kind: "version" }
  | {
      kind: "fetch";
      jql: string;
      out: string;
      allowEmpty: boolean;
      fieldConfig?: string;
      project?: string;
    }
  | { kind: "export"; payload: string; config: string; profile: string }
  | {
      kind: "start";
      key: string;
      workspaceRoot: string;
      templatesRoot?: string;
      variation?: string;
      blank: boolean;
      open: boolean;
    }
  | {
      kind: "start-local";
      vertical: string;
      title: string;
      due?: string;
      workspaceRoot: string;
      templatesRoot?: string;
      variation?: string;
      blank: boolean;
      open: boolean;
    }
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
  "allow-empty": { type: "boolean" },
  "field-config": { type: "string" },
  project: { type: "string" },
  payload: { type: "string" },
  config: { type: "string" },
  profile: { type: "string" },
  "workspace-root": { type: "string" },
  "templates-root": { type: "string" },
  blank: { type: "boolean" },
  open: { type: "boolean" },
  local: { type: "boolean" },
  vertical: { type: "string" },
  title: { type: "string" },
  due: { type: "string" },
  variation: { type: "string" },
  version: { type: "boolean", short: "v" },
} as const;

/** The narrowed `values` shape `parseArgs(CLI_OPTIONS)` yields. */
type CliValues = {
  jql?: string;
  out?: string;
  "allow-empty"?: boolean;
  "field-config"?: string;
  project?: string;
  payload?: string;
  config?: string;
  profile?: string;
  "workspace-root"?: string;
  "templates-root"?: string;
  blank?: boolean;
  open?: boolean;
  local?: boolean;
  vertical?: string;
  title?: string;
  due?: string;
  variation?: string;
  version?: boolean;
};

/**
 * Route Jira-born `start`: the <KEY> positional is required; the composition
 * root fetches it live. The key is uppercased here (brief 036, D3): pure typo
 * hygiene, NOT format validation — the parser stays format-agnostic (v1
 * precedent).
 */
function routeStart(values: CliValues, positionals: string[]): ParsedCommand {
  const key = positionals[1];
  if (key === undefined) {
    return { kind: "usage", message: `Missing required <KEY> for start.\n\n${USAGE}` };
  }
  const workspaceRoot = values["workspace-root"];
  if (workspaceRoot === undefined) {
    return {
      kind: "usage",
      message: `Missing required flag --workspace-root for start.\n\n${USAGE}`,
    };
  }
  // templatesRoot forwarded unresolved: the P1 default (a sibling of the
  // resolved workspace root) needs path.resolve and belongs in cli.ts, not
  // this pure parser.
  return {
    kind: "start",
    key: key.toUpperCase(),
    workspaceRoot,
    templatesRoot: values["templates-root"],
    // Forwarded raw (042 D3): sanitization happens in core's builder, and the
    // parser stays format-agnostic — no validation of the value.
    variation: values.variation,
    blank: values.blank ?? false,
    open: values.open ?? false,
  };
}

/**
 * Route `start --local` (brief 036, D1/D8): no positional key (retroactive
 * linking is the future `link` command's job), required non-blank --title and
 * --vertical, and a --due that must parse as an ISO date when present
 * (amended D11: fail-loud at the command boundary — a typo must never
 * silently file the task under the wrong month). The check reuses core's pure
 * `parseEntrega`, so a --due this parser accepts always yields a month
 * segment in derivePath — validator and month chain coherent by construction.
 */
function routeStartLocal(values: CliValues, positionals: string[]): ParsedCommand {
  if (positionals[1] !== undefined) {
    return {
      kind: "usage",
      message: `A positional <KEY> cannot be combined with --local.\n\n${USAGE}`,
    };
  }
  const title = values.title;
  if (title === undefined || title.trim() === "") {
    return {
      kind: "usage",
      message: `Missing required flag --title for start --local.\n\n${USAGE}`,
    };
  }
  const vertical = values.vertical;
  if (vertical === undefined || vertical.trim() === "") {
    return {
      kind: "usage",
      message: `Missing required flag --vertical for start --local.\n\n${USAGE}`,
    };
  }
  const workspaceRoot = values["workspace-root"];
  if (workspaceRoot === undefined) {
    return {
      kind: "usage",
      message: `Missing required flag --workspace-root for start --local.\n\n${USAGE}`,
    };
  }
  const due = values.due;
  if (due !== undefined && parseEntrega(due)[0] === null) {
    return {
      kind: "usage",
      message: `Invalid --due value "${due}": expected an ISO date (YYYY-MM-DD).\n\n${USAGE}`,
    };
  }
  return {
    kind: "start-local",
    vertical,
    title,
    due,
    workspaceRoot,
    templatesRoot: values["templates-root"],
    // Same raw forwarding as the Jira-born route (042 D3).
    variation: values.variation,
    blank: values.blank ?? false,
    open: values.open ?? false,
  };
}

/**
 * Route a successful parse to a command result. `version` is handled by the
 * caller before this runs; here the command positional is switched: `fetch`
 * requires `--jql`, `export` requires all three flags, `start` splits on the
 * declared-origin flag (D5), anything else (including no command) falls back
 * to `usage`.
 */
function routeCommand(values: CliValues, positionals: string[]): ParsedCommand {
  const command = positionals[0];

  switch (command) {
    case "fetch": {
      if (values.jql === undefined) {
        return { kind: "usage", message: `Missing required flag --jql for fetch.\n\n${USAGE}` };
      }
      const fieldConfig = values["field-config"];
      const project = values.project;
      // Both-or-neither (D8): override mode needs both flags. Exactly one is a
      // usage error (exit 2); neither preserves today's default-mapping behavior.
      if ((fieldConfig === undefined) !== (project === undefined)) {
        return {
          kind: "usage",
          message: `--field-config and --project must be provided together for fetch.\n\n${USAGE}`,
        };
      }
      return {
        kind: "fetch",
        jql: values.jql,
        out: values.out ?? DEFAULT_OUT,
        // Opt-in: the default refuses to overwrite a non-empty payload with an
        // empty result, so forgetting the flag can never destroy data.
        allowEmpty: values["allow-empty"] ?? false,
        fieldConfig,
        project,
      };
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
    case "start": {
      // Origin is declared by the flag, never inferred from key shape (D5).
      return values.local ? routeStartLocal(values, positionals) : routeStart(values, positionals);
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
