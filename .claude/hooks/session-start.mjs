#!/usr/bin/env node
// Claims commit identity for the repository owner in an agent session.
//
// Why this exists: an agent session runs in a container whose git identity is the
// agent's own (`Claude <noreply@anthropic.com>` in Claude Code on the web), so every
// commit lands authored by the agent. The owner approves each one at Pause 3 (R16)
// and is the author in fact; the container is rebuilt per session, so a by-hand fix
// is good for exactly one session.
//
// Both fields move, author and committer, and that is a decision with a price the
// owner accepted on 2026-08-19: the platform signs commits only while the committer
// is its own address, so these commits show on GitHub as Unverified. The agent's
// name is not to appear in this repository's history — that outranks the badge. Do
// not "fix" this by restoring the agent identity; the trade was made on purpose.
//
// The address is GitHub's noreply form: it attributes to the account without
// publishing a private address, where an unverified address would produce commits
// linked to no profile at all.
//
// Signing is turned off for the same reason. The container signs with a key
// registered to the agent's address, so a commit committed by the owner carries a
// signature nothing can verify against — produced and useless. Leaving it on also
// keeps the environment's own Stop hook reporting every commit here as Unverified,
// advice whose only satisfying answer is the agent identity the owner refused.

import { execFileSync } from "node:child_process";

const OWNER_NAME = "Rafael Silva Lor";
const OWNER_EMAIL = "141507006+rafaelsilvalor@users.noreply.github.com";

// Identities this hook may overwrite. Anything else belongs to a human who
// configured it, and overwriting it would misattribute their commits to the owner.
const CLAIMABLE_EMAILS = ["", "noreply@anthropic.com"];

function git(args) {
  return execFileSync("git", args, { encoding: "utf8" }).trim();
}

function readConfig(key) {
  try {
    return git(["config", "--get", key]);
  } catch {
    return ""; // git exits 1 when the key is unset; absence is not an error here
  }
}

try {
  const current = readConfig("user.email");
  if (!CLAIMABLE_EMAILS.includes(current)) {
    console.log(`session-start: git identity left as ${current}`);
    process.exit(0);
  }

  git(["config", "--local", "user.name", OWNER_NAME]);
  git(["config", "--local", "user.email", OWNER_EMAIL]);
  git(["config", "--local", "commit.gpgsign", "false"]);
  console.log(`session-start: git identity set to ${OWNER_NAME} <${OWNER_EMAIL}>, signing off`);
} catch (error) {
  console.error(`session-start: could not set the git identity — ${error.message}`);
  process.exit(0); // a session must still open; commits would carry the agent identity
}
