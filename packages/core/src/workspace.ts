// TaskManifest contract (schemaVersion 2): the `.jacurutu.json` a task folder
// carries at its root. Pure domain — no file I/O, no Drive access, no CLI
// wiring (those are composition-root concerns). `parseManifest` validates
// `unknown` → TaskManifest fail-loud (R4) and lazily migrates schemaVersion 1
// manifests in memory (D4); `serializeManifest` produces the on-disk string
// form, so an upgraded manifest persists as v2 on its next write. The two
// round-trip: parseManifest(serializeManifest(m)) deep-equals m.

/**
 * Current schema version. Declared as a runtime constant (R7) so the version
 * gate in `parseManifest` compares against a single named source, and so
 * writers stamp the same value they validate against.
 */
export const TASK_MANIFEST_SCHEMA_VERSION = 2;

/** Legacy schema version still accepted by `parseManifest` via in-memory migration (D4). */
const LEGACY_SCHEMA_VERSION = 1;

/**
 * Closed set of history event names (D3), declared as a `const` array (R7) so
 * the `HistoryEvent` union derives from one runtime source. `link` is declared
 * now even though no command emits it yet — the parser is fail-loud, and
 * retrofitting the enum later would cost another schema bump.
 */
export const HISTORY_EVENTS = ["start", "ship", "load", "handoff", "link"] as const;

/** One history event name, derived from `HISTORY_EVENTS`. */
export type HistoryEvent = (typeof HISTORY_EVENTS)[number];

/**
 * One append-only history entry (D3). `actor` is `null` when the author is
 * unknown (v1 migration; commands run before identity config exists); `at` is
 * ISO 8601 UTC. Entries are never edited or removed.
 */
export interface HistoryEntry {
  event: HistoryEvent;
  actor: string | null;
  at: string;
}

/**
 * The manifest a task folder carries. All fields required; keys camelCase.
 * Field order mirrors the on-disk layout. Invariant (D1): at least one of
 * `jiraKey` / `localKey` is non-null — enforced by `parseManifest`.
 */
export interface TaskManifest {
  /** Schema version literal; gates parsing before any other field is read (D4). */
  schemaVersion: 2;
  /** Jira issue key when the task has a card (e.g. `"MCA-101"`); else `null`. */
  jiraKey: string | null;
  /** Local identity key when the task was started keyless (e.g. `"RAF-1"`); else `null`. */
  localKey: string | null;
  /** Vertical sigla (e.g. `"OAB"`); the resolved code, not the raw `[CODE] Name`. */
  vertical: string;
  /** Sanitized leaf slug for the task folder (derivePath's leaf, minus the key). */
  slug: string;
  /** Template catalog identifier applied at start — NOT a file path. */
  template: string;
  /**
   * Derived folder-path segments, mirroring derivePath's `readonly string[]`
   * contract (brief 030): stored verbatim, root-agnostic; callers join with
   * `path.join`. Never a pre-joined string.
   */
  drivePath: readonly string[];
  /** Append-only authorship log (D3); replaces v1's scalar `startedAt`/`shippedAt`. */
  history: readonly HistoryEntry[];
}

/** Guard: assert a value is a non-null object suitable for field access. */
function asObject(input: unknown): Record<string, unknown> {
  if (typeof input !== "object" || input === null) {
    throw new TypeError(
      `TaskManifest must be a non-null object, got ${input === null ? "null" : typeof input}`,
    );
  }
  return input as Record<string, unknown>;
}

/** Guard: assert `record[key]` is a string, throwing with field context (R4). */
function asString(record: Record<string, unknown>, key: string): string {
  const value = record[key];
  if (typeof value !== "string") {
    throw new TypeError(`TaskManifest.${key} must be a string, got ${typeof value}`);
  }
  return value;
}

/** Guard: assert `record[key]` is a string[]; a bare string is rejected (D1). */
function asStringArray(record: Record<string, unknown>, key: string): readonly string[] {
  const value = record[key];
  if (!Array.isArray(value) || !value.every((item) => typeof item === "string")) {
    throw new TypeError(`TaskManifest.${key} must be an array of strings`);
  }
  return value;
}

/** Guard: assert `record[key]` is a string or `null` (the nullable-key shape). */
function asStringOrNull(record: Record<string, unknown>, key: string): string | null {
  const value = record[key];
  if (value !== null && typeof value !== "string") {
    throw new TypeError(`TaskManifest.${key} must be a string or null, got ${typeof value}`);
  }
  return value;
}

/** True when `value` is a member of the closed `HISTORY_EVENTS` set (D3). */
function isHistoryEvent(value: string): value is HistoryEvent {
  return (HISTORY_EVENTS as readonly string[]).includes(value);
}

/** Guard: assert one history entry's shape (D5), naming the offending field (R4). */
function asHistoryEntry(value: unknown, index: number): HistoryEntry {
  const context = `TaskManifest.history[${index}]`;
  if (typeof value !== "object" || value === null) {
    throw new TypeError(
      `${context} must be a non-null object, got ${value === null ? "null" : typeof value}`,
    );
  }
  const entry = value as Record<string, unknown>;
  if (typeof entry.event !== "string" || !isHistoryEvent(entry.event)) {
    throw new TypeError(
      `${context}.event must be one of ${HISTORY_EVENTS.join("|")}, got ${JSON.stringify(entry.event)}`,
    );
  }
  if (entry.actor !== null && typeof entry.actor !== "string") {
    throw new TypeError(`${context}.actor must be a string or null, got ${typeof entry.actor}`);
  }
  if (typeof entry.at !== "string") {
    throw new TypeError(`${context}.at must be a string, got ${typeof entry.at}`);
  }
  return { event: entry.event, actor: entry.actor, at: entry.at };
}

/** Guard: assert `record[key]` is an array whose every entry is a valid HistoryEntry. */
function asHistory(record: Record<string, unknown>, key: string): readonly HistoryEntry[] {
  const value = record[key];
  if (!Array.isArray(value)) {
    throw new TypeError(
      `TaskManifest.${key} must be an array of history entries, got ${typeof value}`,
    );
  }
  return value.map((entry, index) => asHistoryEntry(entry, index));
}

/**
 * Validate the v2 shape directly (D5: shape, not semantics — no key-format or
 * history-ordering rules). Enforces the D1 invariant: at least one of
 * `jiraKey` / `localKey` non-null.
 */
function parseManifestV2(record: Record<string, unknown>): TaskManifest {
  const jiraKey = asStringOrNull(record, "jiraKey");
  const localKey = asStringOrNull(record, "localKey");
  if (jiraKey === null && localKey === null) {
    throw new TypeError(
      "TaskManifest requires at least one of jiraKey, localKey to be non-null; both are null",
    );
  }
  return {
    schemaVersion: TASK_MANIFEST_SCHEMA_VERSION,
    jiraKey,
    localKey,
    vertical: asString(record, "vertical"),
    slug: asString(record, "slug"),
    template: asString(record, "template"),
    drivePath: asStringArray(record, "drivePath"),
    history: asHistory(record, "history"),
  };
}

/**
 * Lazy v1→v2 migration (D4): validate the complete v1 shape with the same
 * guards v1 used, THEN construct the upgraded object in memory. `jiraKey` is
 * kept, `localKey: null` (v1 had no local identity), and the witnessed scalar
 * timestamps become history entries with `actor: null` — the time was
 * witnessed, the author was not; nothing is fabricated. Persistence is the
 * caller's concern: the next `serializeManifest` writes v2.
 */
function migrateManifestV1(record: Record<string, unknown>): TaskManifest {
  // Validate the full v1 shape before constructing anything (fail-loud, R4).
  const jiraKey = asString(record, "jiraKey");
  const vertical = asString(record, "vertical");
  const slug = asString(record, "slug");
  const template = asString(record, "template");
  const drivePath = asStringArray(record, "drivePath");
  const startedAt = asString(record, "startedAt");
  const shippedAt = asStringOrNull(record, "shippedAt");

  const history: HistoryEntry[] = [{ event: "start", actor: null, at: startedAt }];
  if (shippedAt !== null) {
    history.push({ event: "ship", actor: null, at: shippedAt });
  }
  return {
    schemaVersion: TASK_MANIFEST_SCHEMA_VERSION,
    jiraKey,
    localKey: null,
    vertical,
    slug,
    template,
    drivePath,
    history,
  };
}

/**
 * Narrow `unknown` to a `TaskManifest`, fail-loud (R4, R24: no `any`). The
 * `schemaVersion` gate runs BEFORE any other field is read (D4): version 1
 * migrates in memory, version 2 validates directly, anything else throws
 * immediately with no migration attempt.
 */
export function parseManifest(input: unknown): TaskManifest {
  const record = asObject(input);
  if (record.schemaVersion === LEGACY_SCHEMA_VERSION) {
    return migrateManifestV1(record);
  }
  if (record.schemaVersion === TASK_MANIFEST_SCHEMA_VERSION) {
    return parseManifestV2(record);
  }
  throw new TypeError(
    `Unsupported TaskManifest schemaVersion ${JSON.stringify(record.schemaVersion)}; expected ${LEGACY_SCHEMA_VERSION} (migrated) or ${TASK_MANIFEST_SCHEMA_VERSION}`,
  );
}

/**
 * The human-facing key (D2): `jiraKey ?? localKey`, governing the folder name
 * and file prefixes. Derived, never stored — one less field to desync. The
 * both-null throw is defensively unreachable after `parseManifest` (D1
 * invariant), but the type system cannot prove it.
 */
export function displayKey(manifest: TaskManifest): string {
  const key = manifest.jiraKey ?? manifest.localKey;
  if (key === null) {
    throw new TypeError(
      "displayKey requires a manifest with jiraKey or localKey non-null; both are null",
    );
  }
  return key;
}

/**
 * Produce the `.jacurutu.json` string for a manifest: pretty-printed (2-space) with
 * a trailing newline. Human-inspected and diffed by Drive's native revision
 * history, so readable output is intentional; round-trips with `parseManifest`.
 */
export function serializeManifest(manifest: TaskManifest): string {
  return `${JSON.stringify(manifest, null, 2)}\n`;
}
