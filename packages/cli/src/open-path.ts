// OS-native opener for `jacurutu start --open` (brief 040, D4/D5). Command
// selection is a pure function of an injectable platform value and the spawn
// function is injectable, so tests assert command/args per platform without
// launching anything (R3). OS glue with zero domain logic — it lives in
// @jacurutu/cli, not behind a core port (R25). Zero new runtime deps (R2).
//
// Exit-path safety (brief 033 precedent): the child is detached, its stdio is
// not inherited, and it is unref()'d immediately, so the parent's event loop
// holds no handle on it — the CLI exits without waiting on the opener and
// without teardown hazards at process exit.

import { spawn } from "node:child_process";

/** Windows opener host: `start` is a cmd builtin, not an executable. */
const WIN32_OPENER = "cmd";
/** macOS opener. */
const DARWIN_OPENER = "open";
/** Opener on every other platform (Linux and friends). */
const FALLBACK_OPENER = "xdg-open";

/** What to spawn: the platform opener executable and its full argv. */
export interface OpenCommand {
  command: string;
  args: string[];
}

/**
 * Spawn options fixed by D4 + Ruling 1 (docs/tasks/040-open-in-software/
 * notes.md): detached + non-inherited stdio so unref() fully releases the
 * child; windowsHide suppresses the console-window flash `cmd /c start` can
 * produce (ignored on non-Windows platforms).
 */
export interface OpenSpawnOptions {
  detached: true;
  stdio: "ignore";
  windowsHide: true;
}

/** Minimal child surface openPath consumes; tests fake it, prod passes node's spawn. */
export interface SpawnedChild {
  on(event: "error", listener: (error: Error) => void): unknown;
  unref(): void;
}

/** Injectable spawn shape (D4): tests substitute a recorder for node's spawn. */
export type SpawnLike = (command: string, args: string[], options: OpenSpawnOptions) => SpawnedChild;

/**
 * Select the platform opener for `targetPath`. Pure — the platform is a
 * parameter, never read from `process` here (D4).
 */
export function selectOpenCommand(platform: string, targetPath: string): OpenCommand {
  if (platform === "win32") {
    // `start` treats its first quoted argument as a window title; the empty
    // "" is the mandatory title slot so the path is never consumed as one.
    return { command: WIN32_OPENER, args: ["/c", "start", "", targetPath] };
  }
  if (platform === "darwin") {
    return { command: DARWIN_OPENER, args: [targetPath] };
  }
  return { command: FALLBACK_OPENER, args: [targetPath] };
}

/**
 * Launch the OS-native opener on `targetPath`, fire-and-forget. Runs only
 * after a fully successful scaffold (D5): a spawn-launch failure is reported
 * to stderr with the attempted path and cause, and the process still exits 0
 * — no rollback, no exit-code change. Declared limit: only launch failure is
 * detectable; detached makes app-level success unobservable by design.
 */
export function openPath(
  targetPath: string,
  platform: string = process.platform,
  spawnFn: SpawnLike = spawn,
): void {
  const { command, args } = selectOpenCommand(platform, targetPath);
  const child = spawnFn(command, args, { detached: true, stdio: "ignore", windowsHide: true });
  // R4: the error is handled — reported with context, never swallowed.
  child.on("error", (error) => {
    console.error(`Failed to open ${targetPath}: ${error.message}`);
  });
  child.unref();
}
