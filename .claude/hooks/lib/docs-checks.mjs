/**
 * The mechanical slice of documentation review.
 *
 * There is no docs equivalent of a test suite. A claim can be false while every
 * path it names still resolves — on 2026-08-09 the doctrine said "five
 * mechanical checks run by the executor" about a directory that existed and had
 * become a tombstone. Nothing here would have caught that, and nothing pretends
 * to. What is checkable is checked; the rest stays with the reader.
 *
 * Two checks:
 *   - a path-shaped reference resolves to a file that exists
 *   - no pt-BR prose on an English-only surface (R9)
 */

// Path-shaped: at least one separator. A bare filename in prose ("the payload
// contract (`payload.ts`)") is a name, not a reference, and flagging it would
// produce noise at a rate that trains the reader to ignore the check.
const PATH_REFERENCE = /`([A-Za-z0-9_.-]+(?:\/[A-Za-z0-9_.*-]+)+\.(?:md|ts|mts|cts|mjs|cjs|js|json|py|sh|yml|yaml))`/g;
const PLACEHOLDER_SEGMENT = /[*<>]/;
// R9: `harness/` is the human-edited surface and may be pt-BR, including the
// COPIAR payloads. Everything else agent-consumed is English-only.
//
// The root `README.md` is absent by E6's sibling, E7: it is the product's front
// door for a Brazilian design team, not an agent-consumed document. Note that
// `docs/explorations/README.md` is NOT exempt — it is doctrine, and `^docs/`
// still covers it. The exception is one file, not a filename.
//
// `AGENTS.md` is here because it was a 209-line untracked duplicate of
// `CLAUDE.md` until 2026-08-18, carrying 8 dead `.Codex/` paths that no check
// could see. It is a pointer now; listing it keeps the path check watching in
// case it grows back into a document.
const ENGLISH_ONLY = [/^CLAUDE\.md$/, /^AGENTS\.md$/, /^docs\//, /^\.claude\//];
const PT_BR_MARKERS =
  /\b(não|para|que|também|então|mas|porque|quando|onde|apenas|sempre|nunca|deve|pode)\b/i;
const CODE_FENCE = /^```/;

/** Every path-shaped reference in a document, with its line number. */
export function extractPathReferences(content) {
  const references = [];
  content.split(/\r?\n/).forEach((line, index) => {
    for (const match of line.matchAll(PATH_REFERENCE)) {
      if (PLACEHOLDER_SEGMENT.test(match[1])) continue;
      references.push({ path: match[1], line: index + 1 });
    }
  });
  return references;
}

/** Build the resolution helpers from a list of tracked paths. */
export function resolverFor(trackedFiles) {
  const set = new Set(trackedFiles);
  return {
    exists: (p) => set.has(p),
    resolvesBySuffix: (p) => trackedFiles.some((f) => f.endsWith(`/${p}`)),
  };
}

/**
 * Resolve a reference the way a reader would: exactly from the repository root,
 * or as a suffix of some tracked path.
 *
 * The suffix rule is not laxness. `harness/init/01-bootstrap-project.md` cites
 * its siblings as `init/02-create-claude-md.md` — loose prose naming a file,
 * not a relative path, and the file plainly exists. What this check is for is
 * catching a reference to something that no longer exists ANYWHERE, which is
 * the breakage a deletion or a rename produces.
 */
export function resolveReference(reference, { exists, resolvesBySuffix }) {
  return exists(reference) || resolvesBySuffix(reference);
}

/**
 * Path references that resolve nowhere.
 *
 * `isOutOfScope` excludes two kinds of correct absence, and both matter or the
 * check reports noise on its first run:
 *
 *   - **gitignored paths.** A doc naming `automation/credentials.json` is
 *     documenting a file that must never be committed. Its absence IS the
 *     correct state.
 *   - **paths outside the repository.** `docs/GOTCHAS.md` names
 *     `gaxios/build/cjs/src/common.js` to locate a trap inside a dependency.
 *     Whether that file exists is not this repository's fact to check.
 */
export function checkReferences(citingFile, content, io) {
  const { isOutOfScope = () => false } = io;
  return extractPathReferences(content)
    .filter(({ path }) => !isOutOfScope(path) && !resolveReference(path, io))
    .map(({ path, line }) => ({
      rule: "ref",
      file: citingFile,
      line,
      decision: "deny",
      reason: `\`${path}\` resolves to no file, from the repo root or from this file's directory`,
    }));
}

/** pt-BR markers outside fenced code, on an English-only surface (R9). */
export function checkLanguage(citingFile, content) {
  if (!ENGLISH_ONLY.some((surface) => surface.test(citingFile))) return [];
  const findings = [];
  let inCode = false;
  content.split(/\r?\n/).forEach((line, index) => {
    if (CODE_FENCE.test(line)) {
      inCode = !inCode;
      return;
    }
    if (!inCode && PT_BR_MARKERS.test(line)) {
      findings.push({
        rule: "R9",
        file: citingFile,
        line: index + 1,
        decision: "ask",
        reason: `pt-BR on an English-only surface: "${line.trim().slice(0, 80)}"`,
      });
    }
  });
  return findings;
}

/** Run both checks over one document. */
export function inspectDocument(citingFile, content, io) {
  return [...checkReferences(citingFile, content, io), ...checkLanguage(citingFile, content)];
}

export { PT_BR_MARKERS, ENGLISH_ONLY };
