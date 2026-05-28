---
name: pre-commit-self-audit
description: Mechanical 5-check audit run by the executor before every Pause 3 submission. Invoke after staging changes for a commit and before showing git status to the user.
---

# Skill: pre-commit-self-audit

## When to invoke

Before every Pause 3 submission. After `git add` has staged the files for the
proposed commit, before showing `git status` and the proposed commit message
to the user. The audit runs five mechanical checks against the staged state
and the proposed commit subject. Output is reported in chat; user reviews
output alongside `git status` and `git diff --stat`.

Do not invoke for `git commit --amend` without re-staging. Do not invoke as
part of `git push` flow (push has its own user authorization step per G-R5).

## What this skill provides

Five checks. Each has a runnable bash snippet and a pass/fail interpretation.
The first four checks operate on the proposed commit subject (passed in by the
caller). The fifth check operates on the currently staged files. All five run
sequentially; do not short-circuit on first failure — report all results.

The skill does NOT auto-correct on failure. On any FAIL, the executor pauses
and reports to the user; the user decides whether to amend the subject,
unstage files, or proceed knowing the cause.

## Inputs

- `SUBJECT` — the proposed commit subject line (single line, no body).
- `EDIT_SCOPE` — list of files the executor intends this commit to cover
  (paths relative to repo root).

## Checks

### Check 1 — Subject length ≤ 72 chars

**Rule:** `CLAUDE.md` R10, `GIT_WORKFLOW.md` G-R3. Subject lines longer than
72 chars break terminal display and `git log --oneline` readability.

```bash
SUBJECT_LEN=$(printf '%s' "$SUBJECT" | wc -L)
if [ "$SUBJECT_LEN" -le 72 ]; then
  echo "  subject length (≤72): PASS ($SUBJECT_LEN)"
else
  echo "  subject length (≤72): FAIL ($SUBJECT_LEN) — shorten subject"
fi
```

### Check 2 — Conventional Commits type prefix

**Rule:** `CLAUDE.md` R10, `GIT_WORKFLOW.md` G-R3. Subject must start with an
allowed type, optional scope in parens, then `: <imperative subject>`.
Allowed types: `feat, fix, refactor, test, chore, docs, perf, ci`.

```bash
if printf '%s' "$SUBJECT" | grep -qE '^(feat|fix|refactor|test|chore|docs|perf|ci)(\([a-z0-9-]+\))?: .+'; then
  TYPE=$(printf '%s' "$SUBJECT" | sed -E 's/^([a-z]+).*/\1/')
  echo "  conventional commits type: PASS ($TYPE)"
else
  echo "  conventional commits type: FAIL — expected <type>(<scope>)?: <subject>"
fi
```

### Check 3 — Imperative mood verb (allowlist / denylist)

**Rule:** `CLAUDE.md` R10, `GIT_WORKFLOW.md` G-R3. The first word of the
subject (after the type prefix and colon) must be an imperative-mood verb.

Allowlist (PASS): `add, fix, update, remove, refactor, rename, document,
migrate, port, bump, drop, restore, revert, support, deprecate, promote,
wire, declare, canonicalize`.

Denylist (FAIL): `added, fixing, updates, fixes, adding, updating, removed,
refactored, renamed, documented, migrated, ported, bumped, dropped, restored,
reverted, supported`.

Verb not in either list: STOP and report — do not auto-classify.

```bash
VERB=$(printf '%s' "$SUBJECT" | sed -E 's/^[a-z]+(\([a-z0-9-]+\))?: ([a-z]+).*/\2/' | tr '[:upper:]' '[:lower:]')
ALLOW="add fix update remove refactor rename document migrate port bump drop restore revert support deprecate promote wire declare canonicalize"
DENY="added fixing updates fixes adding updating removed refactored renamed documented migrated ported bumped dropped restored reverted supported"

if printf '%s\n' $ALLOW | grep -qx "$VERB"; then
  echo "  imperative mood: PASS ($VERB)"
elif printf '%s\n' $DENY | grep -qx "$VERB"; then
  echo "  imperative mood: FAIL ($VERB) — use imperative form (e.g. 'add' not 'added')"
else
  echo "  imperative mood: STOP — verb '$VERB' not in allowlist or denylist; manual review required"
fi
```

#### Verb allowlist as canonical source

The allowlist above is the single source of truth (SSOT) for commit-subject
verbs across the agent pipeline. Two consumers read it:

1. This skill's Check 3 — uses the `ALLOW=` variable in the bash snippet above.
2. `brief-validator` Check C11 — extracts the allowlist from this file at
   runtime via `grep -oE 'ALLOW="[^"]+"' .claude/skills/pre-commit-self-audit/SKILL.md`
   and cross-checks every commit subject declared in the brief's "Commit
   sequence" section.

The validator does **not** duplicate the list. Editing the `ALLOW=` line
here propagates to both consumers on the next run. When adding or removing
a verb, update both the inline prose ("Allowlist (PASS): ...") above **and**
the `ALLOW=` variable — the two must stay in sync because the prose is the
human read and the variable is the machine read.

#### Verbs considered and not adopted

| Rejected | Use instead | Why |
|---|---|---|
| `record` | `document` | "Document" already covers writing things down — decisions, sessions, recaps. "Record" overlaps without adding precision. |
| `ignore` | `add` | Adding a pattern to `.gitignore` is still adding (an entry). The verb describes the staged change, not the runtime effect. |
| `clean` | `remove` | "Remove" names specific files or lines. "Clean" implies broader sweeps that often cross into refactor territory and blur scope. |
| `reduce` | `refactor` | Reducing size, complexity, or duplication is the result of refactoring. The verb should name the action, not its metric. |

### Check 4 — No `Co-authored-by` trailer staged

**Rule:** `CLAUDE.md` R10, `GIT_WORKFLOW.md` G-R3, G-A7. No commit in this
project carries the `Co-authored-by` trailer. Audit checks the proposed
commit message — at audit time, the message exists only as `SUBJECT` plus
whatever body the executor plans to attach. If the body is being assembled
in a temporary file, audit it.

```bash
# Subject alone cannot carry Co-authored-by (single line). If the executor
# uses a commit message file, audit it. Otherwise, this check is trivially PASS
# since `git commit -m "$SUBJECT"` has no body.

if [ -n "${COMMIT_MSG_FILE:-}" ] && [ -f "$COMMIT_MSG_FILE" ]; then
  if grep -qi '^co-authored-by:' "$COMMIT_MSG_FILE"; then
    echo "  no Co-authored-by: FAIL — remove trailer from commit message file"
  else
    echo "  no Co-authored-by: PASS"
  fi
else
  echo "  no Co-authored-by: PASS (subject-only commit)"
fi
```

### Check 5 — Staged scope matches edit scope

**Rule:** `CLAUDE.md` R15 / Lesson #6 of `docs/AGENT_PLAYBOOK.md`. Each
commit must cover exactly the files the executor declared as belonging to
the current edit. Unintended files in the staging area are scope leak;
missing files mean the commit is incomplete.

```bash
# EDIT_SCOPE is a newline-separated list passed by the caller.
STAGED=$(git diff --cached --name-only | sort)
EXPECTED=$(printf '%s\n' $EDIT_SCOPE | sort)

if [ "$STAGED" = "$EXPECTED" ]; then
  echo "  staged scope = edit scope: PASS"
else
  EXTRA=$(comm -23 <(printf '%s' "$STAGED") <(printf '%s' "$EXPECTED"))
  MISSING=$(comm -13 <(printf '%s' "$STAGED") <(printf '%s' "$EXPECTED"))
  echo "  staged scope = edit scope: FAIL"
  [ -n "$EXTRA" ]   && echo "    extra (staged but not in scope):   $EXTRA"
  [ -n "$MISSING" ] && echo "    missing (in scope but not staged): $MISSING"
fi
```

## Output format

The executor reports the audit output as a fenced block in chat, immediately
before submitting Pause 3:

```
pre-commit-self-audit:
  subject length (≤72): PASS (54)
  conventional commits type: PASS (docs)
  imperative mood: PASS (add)
  no Co-authored-by: PASS
  staged scope = edit scope: PASS
```

On failure, the failed check shows `FAIL` plus a one-line cause and a brief
suggestion (as shown in each check's snippet above). Multiple FAILs are all
reported — no short-circuit. STOP on Check 3 (verb not classifiable) halts
the audit; the executor reports the STOP and waits.

## Failure handling

- **Any FAIL:** the executor pauses, reports the audit output, and waits for
  the user to decide. The executor does not auto-amend the subject, unstage
  files, or modify the message file. The user may instruct a fix (e.g.
  "shorten to <new subject>") or proceed with the FAIL knowing the cause.
- **STOP on Check 3:** the executor reports the unclassifiable verb and
  waits. User either confirms the verb is intentional (and the audit relaxes
  for this commit) or proposes an alternative.

## Invariants

- The audit never blocks a commit on its own — the user is the gate.
- The audit never modifies any file or runs any git command beyond
  read-only inspection.
- The audit output goes in chat, never in the commit message.
