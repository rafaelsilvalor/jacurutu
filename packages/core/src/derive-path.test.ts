import { test } from "node:test";
import assert from "node:assert";

import {
  derivePath,
  AVULSAS_BUCKET,
  SLUG_MAX_LEN,
  UNDATED_MONTH,
  UNKNOWN_VERTICAL,
  type DerivePathInput,
} from "./derive-path.js";

/** A baseline MCA input; tests override only the fields they exercise. */
function makeInput(overrides: Partial<DerivePathInput> = {}): DerivePathInput {
  return {
    key: "MCA-101",
    summary: "KV Aulão",
    vertical_raw: "[EC] Concursos",
    entrega_iso: "2026-06-13T19:30:00.000-0300",
    jira_updated_at: "2026-05-01T10:00:00.000-0300",
    campaign: null,
    ...overrides,
  };
}

test("happy path: MCA task yields four segments from the semester root down", () => {
  assert.deepStrictEqual(derivePath(makeInput()), [
    "AVULSAS",
    "EC",
    "2026-06",
    "MCA-101_kv-aulao",
  ]);
});

test("FINDING 1: vertical_raw '[EC] Concursos' yields the code segment 'EC'", () => {
  const segments = derivePath(makeInput({ vertical_raw: "[EC] Concursos" }));
  assert.strictEqual(segments[1], "EC");
});

test("vertical: no-bracket non-empty raw passes through verbatim (4 non-empty)", () => {
  const segments = derivePath(makeInput({ vertical_raw: "Estratégia Concursos" }));
  assert.strictEqual(segments[1], "Estratégia Concursos");
  assert.strictEqual(segments.length, 4);
  for (const segment of segments) {
    assert.ok(segment.length > 0);
  }
});

test("vertical: empty/whitespace raw → UNKNOWN_VERTICAL (4 non-empty)", () => {
  for (const raw of ["", "   "]) {
    const segments = derivePath(makeInput({ vertical_raw: raw }));
    assert.strictEqual(segments[1], UNKNOWN_VERTICAL);
    assert.strictEqual(segments.length, 4);
    for (const segment of segments) {
      assert.ok(segment.length > 0);
    }
  }
});

test("FINDING 2: entrega null → month derived from jira_updated_at fallback", () => {
  const segments = derivePath(
    makeInput({ entrega_iso: null, jira_updated_at: "2026-05-01T10:00:00.000-0300" }),
  );
  assert.strictEqual(segments[2], "2026-05");
});

test("degenerate date: both sources null/empty → UNDATED_MONTH, no throw", () => {
  const segments = derivePath(makeInput({ entrega_iso: null, jira_updated_at: "" }));
  assert.strictEqual(segments[2], UNDATED_MONTH);
});

test("degenerate date: both sources unparseable → UNDATED_MONTH", () => {
  const segments = derivePath(
    makeInput({ entrega_iso: "not-a-date", jira_updated_at: "garbage" }),
  );
  assert.strictEqual(segments[2], UNDATED_MONTH);
});

test("D6: entrega null + unparseable jira_updated_at → month from started_at", () => {
  const segments = derivePath(
    makeInput({
      entrega_iso: null,
      jira_updated_at: "garbage",
      started_at: "2026-07-04T12:00:00.000Z",
    }),
  );
  assert.strictEqual(segments[2], "2026-07");
});

test("D6: all three month sources absent/unparseable → UNDATED_MONTH", () => {
  const segments = derivePath(
    makeInput({ entrega_iso: null, jira_updated_at: "", started_at: null }),
  );
  assert.strictEqual(segments[2], UNDATED_MONTH);
  const alsoUnparseable = derivePath(
    makeInput({ entrega_iso: "not-a-date", jira_updated_at: "garbage", started_at: "nope" }),
  );
  assert.strictEqual(alsoUnparseable[2], UNDATED_MONTH);
});

test("D6: started_at omitted entirely → output identical to today's behavior", () => {
  // makeInput never sets started_at, so this input predates the field.
  const input = makeInput();
  assert.ok(!("started_at" in input));
  assert.deepStrictEqual(derivePath(input), [
    "AVULSAS",
    "EC",
    "2026-06",
    "MCA-101_kv-aulao",
  ]);
  const fallbackInput = makeInput({ entrega_iso: null });
  assert.strictEqual(derivePath(fallbackInput)[2], "2026-05");
});

test("slug: diacritics stripped, non-[a-z0-9-] replaced, repeats collapsed, ends trimmed", () => {
  const segments = derivePath(
    makeInput({ key: "MCA-7", summary: "  Ação: KV — Aulão!!  (final)  " }),
  );
  assert.strictEqual(segments[3], "MCA-7_acao-kv-aulao-final");
});

test("slug: capped at SLUG_MAX_LEN with no trailing hyphen", () => {
  const longSummary = "a".repeat(SLUG_MAX_LEN + 20);
  const segments = derivePath(makeInput({ key: "MCA-8", summary: longSummary }));
  const slug = segments[3].slice("MCA-8_".length);
  assert.ok(slug.length <= SLUG_MAX_LEN);
  assert.ok(!slug.endsWith("-"));
});

test("empty-slug fallback (D4): summary reduces to empty → leaf is KEY only", () => {
  const segments = derivePath(makeInput({ key: "MCA-9", summary: "!!! @#$ ---" }));
  assert.strictEqual(segments[3], "MCA-9");
  assert.ok(!segments[3].endsWith("_"));
});

test("campaign null → grouping segment is the AVULSAS_BUCKET constant", () => {
  const segments = derivePath(makeInput({ campaign: null }));
  assert.strictEqual(segments[0], AVULSAS_BUCKET);
});

test("derivePath is total: always exactly four non-empty segments", () => {
  const inputs: DerivePathInput[] = [
    makeInput(),
    makeInput({ entrega_iso: null, jira_updated_at: "" }),
    makeInput({ summary: "!!!", vertical_raw: "no-bracket" }),
  ];
  for (const input of inputs) {
    const segments = derivePath(input);
    assert.strictEqual(segments.length, 4);
    for (const segment of segments) {
      assert.ok(segment.length > 0, `empty segment in ${JSON.stringify(segments)}`);
    }
  }
});

test("derivePath is deterministic: same input → same output", () => {
  const input = makeInput();
  assert.deepStrictEqual(derivePath(input), derivePath(input));
});
