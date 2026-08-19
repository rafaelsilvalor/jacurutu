// Per-designer identity state for local-born task keys (brief 036, D4/D10):
// ONE production-state JSON file co-locating the designer prefix and the next
// sequence number. Manually seeded in v0; the future `jacurutu config` command
// becomes the writer of this file, and the on-disk format does not change.
// This is the first production-state file in v2, so the seam is deliberate:
// all identity I/O lives here in the composition-root package (R25), and the
// file path is always injected — this module reads no env and composes no
// default path (cli.ts resolves it per P1).

import { readFile, writeFile } from "node:fs/promises";

/** Default identity dir leaf under the user's home dir (P1); cli.ts composes the full path. */
export const IDENTITY_DIR_NAME = ".saci";
/** Default identity filename under `IDENTITY_DIR_NAME` (P1). */
export const IDENTITY_FILENAME = "identity.json";

/** Literal seed shown when the file is missing (D10): the exact JSON to create by hand. */
const SEED_EXAMPLE = `{ "prefix": "RAF", "nextSeq": 1 }`;

/** The identity file's shape (D10): designer prefix + next unused sequence number. */
export interface IdentityState {
  prefix: string;
  nextSeq: number;
}

/**
 * Guard: narrow parsed JSON to an `IdentityState`, fail-loud naming the
 * offending field (R4). No prefix charset validation — that arrives with
 * `jacurutu config` (D4); the v0 backstop is the folder-collision check at start.
 */
function asIdentityState(input: unknown, filePath: string): IdentityState {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    throw new TypeError(`Identity file ${filePath} must hold a JSON object.`);
  }
  const record = input as Record<string, unknown>;
  if (typeof record.prefix !== "string" || record.prefix.trim() === "") {
    throw new TypeError(`Identity file ${filePath}: prefix must be a non-empty string.`);
  }
  if (
    typeof record.nextSeq !== "number" ||
    !Number.isInteger(record.nextSeq) ||
    record.nextSeq < 1
  ) {
    throw new TypeError(`Identity file ${filePath}: nextSeq must be an integer >= 1.`);
  }
  return { prefix: record.prefix, nextSeq: record.nextSeq };
}

/**
 * Read and validate the identity file, fail-loud (D10). A missing file names
 * the resolved path and shows the exact seed JSON; malformed JSON or a wrong
 * shape names what is wrong. Unexpected I/O errors are rethrown, never
 * swallowed (R4).
 */
export async function readIdentityState(filePath: string): Promise<IdentityState> {
  let raw: string;
  try {
    raw = await readFile(filePath, "utf8");
  } catch (error) {
    if (error instanceof Error && (error as NodeJS.ErrnoException).code === "ENOENT") {
      throw new Error(`No identity file at ${filePath}. Seed it manually with: ${SEED_EXAMPLE}`);
    }
    throw error;
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    const cause = error instanceof Error ? error.message : String(error);
    throw new Error(`Malformed JSON in identity file ${filePath}: ${cause}`);
  }
  return asIdentityState(parsed, filePath);
}

/**
 * Persist the state as pretty-printed 2-space JSON with a trailing newline
 * (mirrors `serializeManifest`'s human-inspectable style). No directory
 * creation: a successful read precedes every write, so the parent exists (D10).
 */
export async function writeIdentityState(filePath: string, state: IdentityState): Promise<void> {
  await writeFile(filePath, `${JSON.stringify(state, null, 2)}\n`, "utf8");
}
