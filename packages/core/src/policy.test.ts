import { test } from "node:test";
import assert from "node:assert";

import {
  summaryTokens,
  bestMatchByTokenOverlap,
  pickCopy,
  STOPWORDS_PT,
} from "./policy.js";

test("summaryTokens drops STOPWORDS_PT entries", () => {
  const tokens = summaryTokens("Arte de banner para concurso");
  // "arte", "de", "para" are stopwords; "banner" and "concurso" remain.
  assert.strictEqual(tokens.has("arte"), false);
  assert.strictEqual(tokens.has("de"), false);
  assert.strictEqual(tokens.has("para"), false);
  assert.strictEqual(tokens.has("banner"), true);
  assert.strictEqual(tokens.has("concurso"), true);
});

test("summaryTokens drops tokens of length <= 1", () => {
  const tokens = summaryTokens("x banner y");
  assert.strictEqual(tokens.has("x"), false);
  assert.strictEqual(tokens.has("y"), false);
  assert.strictEqual(tokens.has("banner"), true);
});

test("summaryTokens returns empty set for empty input", () => {
  assert.strictEqual(summaryTokens("").size, 0);
});

test("STOPWORDS_PT contains a representative ported entry", () => {
  assert.strictEqual(STOPWORDS_PT.has("design"), true);
});

test("bestMatchByTokenOverlap returns null when no candidate shares a token", () => {
  const target = new Set(["banner", "concurso"]);
  const candidates = [
    { id: "C-1", tokens: new Set(["folder", "edital"]) },
    { id: "C-2", tokens: new Set(["video", "prova"]) },
  ];
  assert.strictEqual(bestMatchByTokenOverlap(target, candidates), null);
});

test("bestMatchByTokenOverlap returns the single candidate's id", () => {
  const target = new Set(["banner"]);
  const candidates = [{ id: "C-1", tokens: new Set(["unrelated"]) }];
  // Single candidate wins directly, even with zero overlap.
  assert.strictEqual(bestMatchByTokenOverlap(target, candidates), "C-1");
});

test("bestMatchByTokenOverlap picks the clear winner by overlap", () => {
  const target = new Set(["banner", "concurso", "prefeitura"]);
  const candidates = [
    { id: "C-1", tokens: new Set(["banner"]) },
    { id: "C-2", tokens: new Set(["banner", "concurso", "prefeitura"]) },
    { id: "C-3", tokens: new Set(["concurso"]) },
  ];
  assert.strictEqual(bestMatchByTokenOverlap(target, candidates), "C-2");
});

test("bestMatchByTokenOverlap returns null for an empty candidate list", () => {
  assert.strictEqual(bestMatchByTokenOverlap(new Set(["x"]), []), null);
});

test("pickCopy returns source 'sister' with the first sister URL", () => {
  assert.deepStrictEqual(
    pickCopy({
      sisterUrls: ["https://docs.google.com/a", "https://docs.google.com/b"],
      parentUrls: ["https://docs.google.com/p"],
    }),
    { url: "https://docs.google.com/a", source: "sister" },
  );
});

test("pickCopy falls back to parent when no sister URL is present", () => {
  assert.deepStrictEqual(
    pickCopy({
      sisterUrls: [],
      parentUrls: ["https://docs.google.com/p"],
    }),
    { url: "https://docs.google.com/p", source: "parent" },
  );
});

test("pickCopy returns {null, 'fallback'} when no URLs are present", () => {
  assert.deepStrictEqual(pickCopy({ sisterUrls: [], parentUrls: [] }), {
    url: null,
    source: "fallback",
  });
});
