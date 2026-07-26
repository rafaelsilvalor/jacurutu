import { test } from "node:test";
import assert from "node:assert";

import {
  openPath,
  selectOpenCommand,
  type OpenSpawnOptions,
  type SpawnedChild,
} from "./open-path.js";

// All cases drive the injectable seams (D4): the platform is a plain string
// and the spawn function is a recorder, so no test launches a real opener and
// none depends on one existing (brief 040, constraint 4).

const TARGET = "/work/AVULSAS/EC/2026-08/RAF-1_banner/editaveis/RAF-1_banner.psd";

interface SpawnCall {
  command: string;
  args: string[];
  options: OpenSpawnOptions;
}

/** Recorder spawn: captures the call and hands back a child that records its wiring. */
function makeSpawnRecorder(): {
  spawnFn: (command: string, args: string[], options: OpenSpawnOptions) => SpawnedChild;
  calls: SpawnCall[];
  fireError: (error: Error) => void;
  unrefCount: () => number;
} {
  const calls: SpawnCall[] = [];
  let errorListener: ((error: Error) => void) | undefined;
  let unrefs = 0;
  return {
    spawnFn: (command, args, options) => {
      calls.push({ command, args, options });
      const child: SpawnedChild = {
        on(_event, listener) {
          errorListener = listener;
          return child;
        },
        unref() {
          unrefs += 1;
        },
      };
      return child;
    },
    calls,
    fireError: (error) => {
      assert.ok(errorListener, "openPath must register an error listener before firing");
      errorListener(error);
    },
    unrefCount: () => unrefs,
  };
}

test("selectOpenCommand on win32 uses cmd /c start with the empty title slot", () => {
  assert.deepStrictEqual(selectOpenCommand("win32", TARGET), {
    command: "cmd",
    args: ["/c", "start", "", TARGET],
  });
});

test("selectOpenCommand on darwin uses open", () => {
  assert.deepStrictEqual(selectOpenCommand("darwin", TARGET), {
    command: "open",
    args: [TARGET],
  });
});

test("selectOpenCommand on any other platform falls back to xdg-open", () => {
  for (const platform of ["linux", "freebsd", "sunos"]) {
    assert.deepStrictEqual(selectOpenCommand(platform, TARGET), {
      command: "xdg-open",
      args: [TARGET],
    });
  }
});

test("openPath spawns the selected opener with the full ruled options and unrefs", () => {
  const recorder = makeSpawnRecorder();

  openPath(TARGET, "linux", recorder.spawnFn);

  assert.strictEqual(recorder.calls.length, 1);
  // Ruling 1 (docs/tasks/040-open-in-software/notes.md): the FULL options
  // object, asserted literally — detached, stdio ignored, windowsHide.
  assert.deepStrictEqual(recorder.calls[0], {
    command: "xdg-open",
    args: [TARGET],
    options: { detached: true, stdio: "ignore", windowsHide: true },
  });
  assert.strictEqual(recorder.unrefCount(), 1);
});

test("openPath on win32 forwards the cmd start argv through the injected spawn", () => {
  const recorder = makeSpawnRecorder();

  openPath(TARGET, "win32", recorder.spawnFn);

  assert.deepStrictEqual(recorder.calls[0], {
    command: "cmd",
    args: ["/c", "start", "", TARGET],
    options: { detached: true, stdio: "ignore", windowsHide: true },
  });
});

test("openPath reports a spawn-launch failure to stderr and leaves the exit code alone", (t) => {
  const recorder = makeSpawnRecorder();
  const errorMock = t.mock.method(console, "error", () => {});
  const exitCodeBefore = process.exitCode;

  openPath(TARGET, "darwin", recorder.spawnFn);
  recorder.fireError(new Error("spawn open ENOENT"));

  assert.strictEqual(errorMock.mock.callCount(), 1);
  const line = errorMock.mock.calls[0].arguments[0] as string;
  assert.match(line, /^Failed to open /);
  assert.ok(line.includes(TARGET), "stderr line must carry the attempted path (D5)");
  assert.ok(line.includes("spawn open ENOENT"), "stderr line must carry the cause (D5)");
  // D5: launch failure never flips the exit code — the scaffold already succeeded.
  assert.strictEqual(process.exitCode, exitCodeBefore);
});
