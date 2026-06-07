import { test } from "node:test";
import assert from "node:assert";

import {
  normalizeText,
  slugNomeCurto,
  parseVertical,
  parseEntrega,
  extractFirstDriveUrl,
  tokensForPairing,
  STOPWORDS_SLUG,
  STOPWORDS_PAIRING,
} from "./transform.js";

test("normalizeText lowercases and strips diacritics", () => {
  assert.strictEqual(normalizeText("Concução ÁÉÍÓÚ"), "concucao aeiou");
});

test("normalizeText returns empty string for empty input", () => {
  assert.strictEqual(normalizeText(""), "");
});

test("parseEntrega returns (date, '') for a date-only input", () => {
  assert.deepStrictEqual(parseEntrega("2026-05-13"), ["2026-05-13", ""]);
});

test("parseEntrega formats minutes-zero time as '<H>h'", () => {
  assert.deepStrictEqual(parseEntrega("2026-05-13T19:00:00.000-0300"), [
    "2026-05-13",
    "19h",
  ]);
});

test("parseEntrega formats non-zero minutes as '<H>h<MM>'", () => {
  assert.deepStrictEqual(parseEntrega("2026-05-13T19:30:00.000-0300"), [
    "2026-05-13",
    "19h30",
  ]);
});

test("parseEntrega treats midnight as no specific time", () => {
  assert.deepStrictEqual(parseEntrega("2026-05-13T00:00:00.000-0300"), [
    "2026-05-13",
    "",
  ]);
});

test("parseEntrega returns (null, '') for unparseable input", () => {
  assert.deepStrictEqual(parseEntrega("not-a-date"), [null, ""]);
});

test("parseEntrega returns (null, '') for null input", () => {
  assert.deepStrictEqual(parseEntrega(null), [null, ""]);
});

test("parseEntrega rejects an impossible date-only value (month)", () => {
  assert.deepStrictEqual(parseEntrega("2026-13-40"), [null, ""]);
});

test("parseEntrega rejects an impossible date-only value (day)", () => {
  assert.deepStrictEqual(parseEntrega("2026-02-30"), [null, ""]);
});

test("parseEntrega rejects an impossible full-ISO date (month)", () => {
  assert.deepStrictEqual(
    parseEntrega("2026-13-40T10:00:00.000-0300"),
    [null, ""],
  );
});

test("parseEntrega rejects an impossible full-ISO date (day)", () => {
  assert.deepStrictEqual(
    parseEntrega("2026-02-30T10:00:00.000-0300"),
    [null, ""],
  );
});

test("slugNomeCurto falls back to childSummary when parent is generic", () => {
  const parent = "Criativos Estáticos | Performance - Parte 12";
  const child = "Concurso PMSP 2026";
  // "concurso" is a STOPWORDS_SLUG entry, so it is dropped from the slug.
  assert.strictEqual(slugNomeCurto(parent, child), "pmsp-2026");
});

test("slugNomeCurto falls back to childSummary when parent is empty", () => {
  assert.strictEqual(slugNomeCurto("", "Banco do Brasil 2026"), "banco-brasil-2026");
});

test("slugNomeCurto returns 'demanda' when no usable tokens remain", () => {
  // All tokens are length 1, so both filter passes leave no token.
  assert.strictEqual(slugNomeCurto("a e o", ""), "demanda");
});

test("parseVertical returns the bracketed content", () => {
  assert.strictEqual(parseVertical("[EC] Concursos"), "EC");
});

test("parseVertical returns the trimmed raw string when no brackets present", () => {
  assert.strictEqual(parseVertical("  Concursos  "), "Concursos");
});

test("extractFirstDriveUrl returns null when no Drive/Docs URL is present", () => {
  assert.strictEqual(extractFirstDriveUrl("no link here"), null);
});

test("extractFirstDriveUrl strips trailing markdown/punctuation", () => {
  const text = "see [doc](https://drive.google.com/file/d/abc123).";
  assert.strictEqual(
    extractFirstDriveUrl(text),
    "https://drive.google.com/file/d/abc123",
  );
});

test("tokensForPairing drops STOPWORDS_PAIRING and tokens of length <= 2", () => {
  const tokens = tokensForPairing("Concurso de Criativos Estáticos PM SP");
  assert.deepStrictEqual([...tokens].sort(), []);
});

test("tokensForPairing keeps content tokens of length > 2", () => {
  const tokens = tokensForPairing("Banco Brasil 2026");
  assert.deepStrictEqual([...tokens].sort(), ["2026", "banco", "brasil"]);
});

test("STOPWORDS_PAIRING is a superset of STOPWORDS_SLUG", () => {
  for (const w of STOPWORDS_SLUG) {
    assert.ok(STOPWORDS_PAIRING.has(w), `expected pairing stopwords to contain '${w}'`);
  }
});
