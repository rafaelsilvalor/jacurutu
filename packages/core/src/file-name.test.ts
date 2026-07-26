import { test } from "node:test";
import assert from "node:assert";

import { buildEditableStem, sanitizeSlug, SLUG_MAX_LEN } from "./file-name.js";
import { UNKNOWN_VERTICAL } from "./derive-path.js";

// The session-033 shape that motivated the format (brief 042, D2).
test("stem: vertical_key_descricao_variacao for the session-033 shape", () => {
  const stem = buildEditableStem({
    vertical: "ECJ",
    key: "MCA-63821",
    summary: "Informativo 893 - Avaliação de Títulos",
    variation: "Carrossel",
  });
  assert.strictEqual(stem, "ecj_mca-63821_informativo-893-avaliacao-de-titulos_carrossel");
});

test("stem: absent variation yields no trailing underscore (D3)", () => {
  const stem = buildEditableStem({
    vertical: "EC",
    key: "MCA-101",
    summary: "Banner principal",
  });
  assert.strictEqual(stem, "ec_mca-101_banner-principal");
});

test("stem: variation sanitizing to empty is omitted (D3)", () => {
  const stem = buildEditableStem({
    vertical: "EC",
    key: "MCA-101",
    summary: "Banner principal",
    variation: "!!!",
  });
  assert.strictEqual(stem, "ec_mca-101_banner-principal");
});

test("stem: descricao sanitizing to empty is omitted (D2)", () => {
  const stem = buildEditableStem({
    vertical: "EC",
    key: "MCA-101",
    summary: "!!!",
    variation: "Carrossel",
  });
  assert.strictEqual(stem, "ec_mca-101_carrossel");
});

test("stem: UNKNOWN_VERTICAL sentinel passes through as-is (D2)", () => {
  const stem = buildEditableStem({
    vertical: UNKNOWN_VERTICAL,
    key: "MCA-101",
    summary: "Banner principal",
  });
  assert.strictEqual(stem, `${UNKNOWN_VERTICAL}_mca-101_banner-principal`);
});

test("stem: local keys are lowercased like Jira keys (D2)", () => {
  const stem = buildEditableStem({
    vertical: "EC",
    key: "RAF-1",
    summary: "Banner principal",
  });
  assert.strictEqual(stem, "ec_raf-1_banner-principal");
});

// sanitizeSlug is now a public export (D6); pin its contract directly. The
// derivePath leaf keeps its own coverage in derive-path.test.ts (constraint 5).
test("sanitizeSlug: lowercases, strips diacritics, hyphenates non-alphanumerics", () => {
  assert.strictEqual(sanitizeSlug("Avaliação de Títulos"), "avaliacao-de-titulos");
});

test("sanitizeSlug: collapses hyphen runs and trims the ends", () => {
  assert.strictEqual(sanitizeSlug("  Banner -- principal!  "), "banner-principal");
});

test("sanitizeSlug: only-symbol input reduces to the empty string", () => {
  assert.strictEqual(sanitizeSlug("!!!"), "");
});

test("sanitizeSlug: capped at SLUG_MAX_LEN with no trailing hyphen", () => {
  const long = `${"a".repeat(SLUG_MAX_LEN - 1)}-${"b".repeat(20)}`;
  const slug = sanitizeSlug(long);
  assert.ok(slug.length <= SLUG_MAX_LEN);
  assert.ok(!slug.endsWith("-"));
});
