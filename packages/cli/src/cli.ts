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
