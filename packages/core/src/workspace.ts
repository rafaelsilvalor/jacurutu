// TaskManifest v0 contract: the `.saci.json` a task folder carries at its root.
// Pure domain — no file I/O, no Drive access, no CLI wiring (those are
// composition-root concerns). `parseManifest` validates `unknown` → TaskManifest
// fail-loud (R4); `serializeManifest` produces the on-disk string form. The two
// round-trip: parseManifest(serializeManifest(m)) deep-equals m.

/**
 * Schema version of the v0 manifest. Declared as a runtime constant (R7) so the
 * version gate in `parseManifest` compares against a single named source, and so
 * writers stamp the same value they validate against.
 */
export const TASK_MANIFEST_SCHEMA_VERSION = 1;

/**
 * The manifest a task folder carries. All fields required; keys camelCase;
 * timestamps ISO 8601 UTC. Field order mirrors the on-disk layout.
 */
export interface TaskManifest {
  /** Schema version literal; gates parsing before any other field is read (D4). */
  schemaVersion: 1;
  /** Jira issue key this task belongs to (the identity key, e.g. `"MCA-101"`). */
  jiraKey: string;
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
  /** When the task was started (ISO 8601 UTC). */
  startedAt: string;
  /**
   * When the task shipped (ISO 8601 UTC), or `null` until the first ship.
   * Present-with-null gives a uniform forward contract (a writer never omits
   * the key), paralleling `ParsedCommand`'s optional-shape discipline.
   */
  shippedAt: string | null;
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

/** Guard: assert `record[key]` is a string or `null` (the `shippedAt` shape). */
function asStringOrNull(record: Record<string, unknown>, key: string): string | null {
  const value = record[key];
  if (value !== null && typeof value !== "string") {
    throw new TypeError(`TaskManifest.${key} must be a string or null, got ${typeof value}`);
  }
  return value;
}

/**
 * Narrow `unknown` to a `TaskManifest`, fail-loud (R4, R24: no `any`). The
 * `schemaVersion === TASK_MANIFEST_SCHEMA_VERSION` gate runs BEFORE any other
 * field is read (D1 + D4): an unknown version throws immediately with no
 * migration attempt.
 */
export function parseManifest(input: unknown): TaskManifest {
  const record = asObject(input);
  if (record.schemaVersion !== TASK_MANIFEST_SCHEMA_VERSION) {
    throw new TypeError(
      `Unsupported TaskManifest schemaVersion ${JSON.stringify(record.schemaVersion)}; expected ${TASK_MANIFEST_SCHEMA_VERSION}`,
    );
  }
  return {
    schemaVersion: TASK_MANIFEST_SCHEMA_VERSION,
    jiraKey: asString(record, "jiraKey"),
    vertical: asString(record, "vertical"),
    slug: asString(record, "slug"),
    template: asString(record, "template"),
    drivePath: asStringArray(record, "drivePath"),
    startedAt: asString(record, "startedAt"),
    shippedAt: asStringOrNull(record, "shippedAt"),
  };
}

/**
 * Produce the `.saci.json` string for a manifest: pretty-printed (2-space) with
 * a trailing newline. Human-inspected and diffed by Drive's native revision
 * history, so readable output is intentional; round-trips with `parseManifest`.
 */
export function serializeManifest(manifest: TaskManifest): string {
  return `${JSON.stringify(manifest, null, 2)}\n`;
}
