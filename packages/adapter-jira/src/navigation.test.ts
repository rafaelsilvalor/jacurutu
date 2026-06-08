import { test } from "node:test";
import assert from "node:assert";

import { bestSisterMatch, resolveCopy } from "./navigation.js";

const DESIGN_URL = "https://drive.google.com/file/d/design123/view";
const SISTER_URL = "https://drive.google.com/file/d/sister456/view";
const SISTER_COMMENT_URL = "https://drive.google.com/file/d/comment789/view";
const PARENT_URL = "https://docs.google.com/document/d/parentABC/edit";

const PARENT_KEY = "MCA-100";

function issue(key: string, summary: string, fields: Record<string, unknown> = {}) {
  return { key, fields: { summary, ...fields } };
}

function descriptionDoc(url: string) {
  return {
    type: "doc",
    content: [{ type: "inlineCard", attrs: { url } }],
  };
}

function commentField(url: string) {
  return {
    comments: [{ body: descriptionDoc(url) }],
  };
}

// --- bestSisterMatch --------------------------------------------------------

test("single-candidate sister is picked directly without overlap check", () => {
  const design = issue("MCA-1", "Banner concurso INSS");
  // No shared tokens, but a lone candidate still wins (seed: len == 1 direct).
  const lone = issue("MCA-2", "completely unrelated text here");
  assert.strictEqual(bestSisterMatch(design, [lone]), lone);
});

test("multi-candidate sister picks the highest token overlap (argmax)", () => {
  const design = issue("MCA-1", "Banner concurso INSS aposentadoria");
  const weak = issue("MCA-2", "Banner promocao geral");
  const strong = issue("MCA-3", "Copy concurso INSS aposentadoria detalhe");
  assert.strictEqual(bestSisterMatch(design, [weak, strong]), strong);
});

test("zero overlap among multiple candidates yields no sister", () => {
  const design = issue("MCA-1", "Banner concurso INSS");
  const a = issue("MCA-2", "promocao verao praia");
  const b = issue("MCA-3", "evento corporativo anual");
  assert.strictEqual(bestSisterMatch(design, [a, b]), null);
});

test("empty candidate list yields no sister", () => {
  const design = issue("MCA-1", "Banner concurso INSS");
  assert.strictEqual(bestSisterMatch(design, []), null);
});

// --- resolveCopy ------------------------------------------------------------

test("sister URL from description resolves copy_source sister", () => {
  const design = issue("MCA-1", "Banner concurso INSS", {
    parent: { key: PARENT_KEY },
  });
  const sister = issue("MCA-2", "Copy concurso INSS", {
    description: descriptionDoc(SISTER_URL),
  });
  const result = resolveCopy(
    design,
    new Map([[PARENT_KEY, [sister]]]),
    new Map(),
  );
  assert.deepStrictEqual(result, { url: SISTER_URL, source: "sister" });
});

test("sister URL from comment is used when description has none", () => {
  const design = issue("MCA-1", "Banner concurso INSS", {
    parent: { key: PARENT_KEY },
  });
  const sister = issue("MCA-2", "Copy concurso INSS", {
    description: { type: "doc", content: [] },
    comment: commentField(SISTER_COMMENT_URL),
  });
  const result = resolveCopy(
    design,
    new Map([[PARENT_KEY, [sister]]]),
    new Map(),
  );
  assert.deepStrictEqual(result, { url: SISTER_COMMENT_URL, source: "sister" });
});

test("matched sister with no URL falls through to parent description", () => {
  const design = issue("MCA-1", "Banner concurso INSS", {
    parent: { key: PARENT_KEY },
  });
  const sister = issue("MCA-2", "Copy concurso INSS", {
    description: { type: "doc", content: [] },
  });
  const parent = issue(PARENT_KEY, "Parent concurso INSS", {
    description: descriptionDoc(PARENT_URL),
  });
  const result = resolveCopy(
    design,
    new Map([[PARENT_KEY, [sister]]]),
    new Map([[PARENT_KEY, parent]]),
  );
  assert.deepStrictEqual(result, { url: PARENT_URL, source: "parent" });
});

test("parent description resolves copy_source parent when no sister matches", () => {
  const design = issue("MCA-1", "Banner concurso INSS", {
    parent: { key: PARENT_KEY },
  });
  const parent = issue(PARENT_KEY, "Parent concurso INSS", {
    description: descriptionDoc(PARENT_URL),
  });
  const result = resolveCopy(
    design,
    new Map(),
    new Map([[PARENT_KEY, parent]]),
  );
  assert.deepStrictEqual(result, { url: PARENT_URL, source: "parent" });
});

test("no sister and no parent URL resolves to fallback null", () => {
  const design = issue("MCA-1", "Banner concurso INSS", {
    parent: { key: PARENT_KEY },
  });
  const result = resolveCopy(design, new Map(), new Map());
  assert.deepStrictEqual(result, { url: null, source: "fallback" });
});

test("design issue without a parent resolves to fallback", () => {
  const design = issue("MCA-1", "Banner concurso INSS");
  const sister = issue("MCA-2", "Copy concurso INSS", {
    description: descriptionDoc(SISTER_URL),
  });
  const result = resolveCopy(
    design,
    new Map([[PARENT_KEY, [sister]]]),
    new Map(),
  );
  assert.deepStrictEqual(result, { url: null, source: "fallback" });
});
