# Snippets: 016 — Phase 1 monorepo bootstrap

> Companion file to `./brief.md`. Every code, JSON, and Markdown snippet
> referenced by an Edit in the brief is reproduced here, verbatim, under a
> heading naming its target path (`### <path>`). The executor copies the
> content of each fenced block into the file at the matching path.
>
> Trailing newline convention: every file written from a snippet ends with
> exactly one newline character (POSIX text file convention). Verify with
> `tail -c1 <file> | xxd | grep 0a`.

## Table of contents

- Root configs
  - [`tsconfig.base.json`](#tsconfigbasejson)
  - [`tsconfig.json`](#tsconfigjson)
- `@saci/core`
  - [`packages/core/package.json`](#packagescorepackagejson)
  - [`packages/core/tsconfig.json`](#packagescoretsconfigjson)
  - [`packages/core/src/index.ts`](#packagescoresrcindexts)
  - [`packages/core/src/index.test.ts`](#packagescoresrcindextestts)
- `@saci/adapter-jira`
  - [`packages/adapter-jira/package.json`](#packagesadapter-jirapackagejson)
  - [`packages/adapter-jira/tsconfig.json`](#packagesadapter-jiratsconfigjson)
  - [`packages/adapter-jira/src/index.ts`](#packagesadapter-jirasrcindexts)
  - [`packages/adapter-jira/src/index.test.ts`](#packagesadapter-jirasrcindextestts)
- `@saci/adapter-sheets`
  - [`packages/adapter-sheets/package.json`](#packagesadapter-sheetspackagejson)
  - [`packages/adapter-sheets/tsconfig.json`](#packagesadapter-sheetstsconfigjson)
  - [`packages/adapter-sheets/src/index.ts`](#packagesadapter-sheetssrcindexts)
  - [`packages/adapter-sheets/src/index.test.ts`](#packagesadapter-sheetssrcindextestts)
- `@saci/cli`
  - [`packages/cli/package.json`](#packagesclipackagejson)
  - [`packages/cli/tsconfig.json`](#packagesclitsconfigjson)
  - [`packages/cli/src/cli.ts`](#packagesclisrcclits)
  - [`packages/cli/src/cli.test.ts`](#packagesclisrcclitestts)
- ROADMAP addendum
  - [`docs/ROADMAP.md` — §Pending decisions entries 6 and 7](#docsroadmapmd--pending-decisions-entries-6-and-7)
- MENTOR_BRIEF addendum
  - [`docs/MENTOR_BRIEF.md` — §2 Node runtime target bullet](#docsmentor_briefmd--2-node-runtime-target-bullet)

---

## Root configs

### `tsconfig.base.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "composite": true,
    "outDir": "./dist",
    "rootDir": "./src"
  }
}
```

### `tsconfig.json`

```json
{
  "files": [],
  "references": [
    { "path": "./packages/core" },
    { "path": "./packages/adapter-jira" },
    { "path": "./packages/adapter-sheets" },
    { "path": "./packages/cli" }
  ]
}
```

---

## `@saci/core`

### `packages/core/package.json`

```json
{
  "name": "@saci/core",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "scripts": {
    "build": "tsc -p ."
  }
}
```

### `packages/core/tsconfig.json`

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*.ts"]
}
```

### `packages/core/src/index.ts`

```typescript
// Phase 1 placeholder. Real domain code lands in Phase 2 (lib_transform.py port).
export const SACI_CORE_PHASE = 1;
```

### `packages/core/src/index.test.ts`

```typescript
import { test } from "node:test";
import assert from "node:assert";

// Phase 1 sentinel: confirms the package compiles, the test
// runner discovers this file, and node:test executes without
// error. Real tests arrive in Phase 2 with domain logic.
test("package compiles and runs", () => {
  assert.strictEqual(true, true);
});
```

---

## `@saci/adapter-jira`

### `packages/adapter-jira/package.json`

```json
{
  "name": "@saci/adapter-jira",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "scripts": {
    "build": "tsc -p ."
  },
  "dependencies": {
    "@saci/core": "*"
  }
}
```

### `packages/adapter-jira/tsconfig.json`

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*.ts"],
  "references": [{ "path": "../core" }]
}
```

### `packages/adapter-jira/src/index.ts`

```typescript
// Phase 1 placeholder. Real Jira REST adapter lands in Phase 4.
import { SACI_CORE_PHASE } from "@saci/core";
export const ADAPTER_JIRA_PHASE = SACI_CORE_PHASE;
```

### `packages/adapter-jira/src/index.test.ts`

```typescript
import { test } from "node:test";
import assert from "node:assert";

// Phase 1 sentinel: confirms the package compiles, the test
// runner discovers this file, and node:test executes without
// error. Real tests arrive in Phase 2 with domain logic.
test("package compiles and runs", () => {
  assert.strictEqual(true, true);
});
```

---

## `@saci/adapter-sheets`

### `packages/adapter-sheets/package.json`

```json
{
  "name": "@saci/adapter-sheets",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "scripts": {
    "build": "tsc -p ."
  },
  "dependencies": {
    "@saci/core": "*"
  }
}
```

### `packages/adapter-sheets/tsconfig.json`

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*.ts"],
  "references": [{ "path": "../core" }]
}
```

### `packages/adapter-sheets/src/index.ts`

```typescript
// Phase 1 placeholder. Real Google Sheets adapter lands in Phase 4.
import { SACI_CORE_PHASE } from "@saci/core";
export const ADAPTER_SHEETS_PHASE = SACI_CORE_PHASE;
```

### `packages/adapter-sheets/src/index.test.ts`

```typescript
import { test } from "node:test";
import assert from "node:assert";

// Phase 1 sentinel: confirms the package compiles, the test
// runner discovers this file, and node:test executes without
// error. Real tests arrive in Phase 2 with domain logic.
test("package compiles and runs", () => {
  assert.strictEqual(true, true);
});
```

---

## `@saci/cli`

### `packages/cli/package.json`

```json
{
  "name": "@saci/cli",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "main": "./dist/cli.js",
  "types": "./dist/cli.d.ts",
  "bin": {
    "saci": "./dist/cli.js"
  },
  "engines": {
    "node": ">=22.0.0"
  },
  "scripts": {
    "build": "tsc -p ."
  },
  "dependencies": {
    "@saci/core": "*",
    "@saci/adapter-jira": "*",
    "@saci/adapter-sheets": "*"
  }
}
```

### `packages/cli/tsconfig.json`

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "resolveJsonModule": true
  },
  "include": ["src/**/*.ts"],
  "references": [
    { "path": "../core" },
    { "path": "../adapter-jira" },
    { "path": "../adapter-sheets" }
  ]
}
```

### `packages/cli/src/cli.ts`

```typescript
#!/usr/bin/env node
import { parseArgs } from "node:util";
import pkg from "../package.json" with { type: "json" };

const { values } = parseArgs({
  options: {
    version: { type: "boolean", short: "v" },
  },
  allowPositionals: true,
});

if (values.version) {
  // pkg.version reflects the internal @saci/cli package version
  // (0.0.0 per D5 versioning defer). Product versions live in git
  // tags on root until Phase 4. This is intentional, not a bug.
  process.stdout.write(`${pkg.version}\n`);
  process.exit(0);
}

process.stdout.write("saci v2 — Phase 1 bootstrap. No commands yet.\n");
process.exit(0);
```

### `packages/cli/src/cli.test.ts`

```typescript
import { test } from "node:test";
import assert from "node:assert";

// Phase 1 sentinel: confirms the package compiles, the test
// runner discovers this file, and node:test executes without
// error. Real tests arrive in Phase 2 with domain logic.
test("package compiles and runs", () => {
  assert.strictEqual(true, true);
});
```

---

## ROADMAP addendum

### `docs/ROADMAP.md` — §Pending decisions entries 6 and 7

Append to the existing `§Pending decisions` list. The current last entry is
numbered `5.`; the two entries below continue the numbering:

```markdown
6. **CLI library — final choice.** Phase 1 uses the `node:util` `parseArgs`
   builtin (D4). Revisit at the Phase 2→3 transition when production flow
   brings real commands — choice between `commander`, `citty`, or
   continuing with the builtin will be informed by real usage data.
7. **Versioning policy.** Phase 1–3 use `"version": "0.0.0"` on every
   `package.json` plus git tags on the root (D5). Decide single vs.
   independent vs. continued defer in Phase 4 when adapter stability
   provides input.
```

---

## MENTOR_BRIEF addendum

### `docs/MENTOR_BRIEF.md` — §2 Node runtime target bullet

Append the bullet below to the existing "Active architectural decisions"
sub-list in `docs/MENTOR_BRIEF.md` §2 — the sub-list whose current last
entry is the "Google Sheets stays as the team-facing collective
interface" bullet (around lines 45–46 of `MENTOR_BRIEF.md` at the time
this brief was authored).

Insert the new bullet **after** the Google Sheets bullet and **before**
the start of the "Active product direction" sub-list. The bullet uses
the same two-space indent and `- ` prefix as its siblings in the
sub-list.

```markdown
  - **Node runtime target: ≥22.0.0** (pinned 2026-05-27 in task 016).
    Saci v2 runs on Node 22 LTS — enables ESM import attributes
    (`with { type: "json" }`) and gives comfortable margin for Phase 3
    production. Pinned in three places: root `package.json` `engines`,
    `.nvmrc` at repo root, and `packages/cli/package.json` `engines`.
```
