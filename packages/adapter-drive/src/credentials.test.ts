import { test } from "node:test";
import assert from "node:assert";
import { mkdtemp, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { CREDENTIALS_DIR_NAME, OAUTH_CLIENT_FILENAME, TOKEN_FILENAME } from "./constants.js";
import {
  credentialsDir,
  ensureCredentialsDir,
  oauthClientPath,
  parseOAuthClient,
  readOAuthClient,
  readStoredToken,
  tokenPath,
  writeStoredToken,
} from "./credentials.js";

// Every fixture below uses obvious placeholders. No value here is shaped like a real
// credential (binding — docs/explorations/drive-oauth.md §10).
const FIXTURE_CLIENT_ID = "test-client-id";
const FIXTURE_CLIENT_SECRET = "test-client-secret";
const FIXTURE_PATH = "/fixture/oauth_client.json";

function desktopClientJson(): string {
  return JSON.stringify({
    installed: {
      client_id: FIXTURE_CLIENT_ID,
      project_id: "test-project",
      client_secret: FIXTURE_CLIENT_SECRET,
      redirect_uris: ["http://localhost"],
    },
  });
}

test("(a) parseOAuthClient reads id and secret from the installed section", () => {
  const parsed = parseOAuthClient(desktopClientJson(), FIXTURE_PATH);
  assert.deepStrictEqual(parsed, {
    clientId: FIXTURE_CLIENT_ID,
    clientSecret: FIXTURE_CLIENT_SECRET,
  });
});

test("(b) parseOAuthClient fails loud on malformed JSON, naming the file", () => {
  assert.throws(
    () => parseOAuthClient("{ not json", FIXTURE_PATH),
    (error: Error) => {
      assert.match(error.message, /Malformed JSON in OAuth client file/);
      assert.ok(error.message.includes(FIXTURE_PATH));
      return true;
    },
  );
});

test("(c) parseOAuthClient rejects a JSON object with no installed section", () => {
  assert.throws(
    () => parseOAuthClient(JSON.stringify({ other: {} }), FIXTURE_PATH),
    (error: Error) => {
      assert.match(error.message, /has no "installed" section/);
      assert.match(error.message, /Desktop app/);
      return true;
    },
  );
});

test("(d) parseOAuthClient rejects a web-only client with the Desktop-app pointer", () => {
  const webClient = JSON.stringify({
    web: { client_id: FIXTURE_CLIENT_ID, client_secret: FIXTURE_CLIENT_SECRET },
  });
  assert.throws(
    () => parseOAuthClient(webClient, FIXTURE_PATH),
    (error: Error) => {
      assert.match(error.message, /has a "web" section but no "installed" section/);
      assert.match(error.message, /Desktop app/);
      return true;
    },
  );
});

test("(e) parseOAuthClient names the missing client_id field", () => {
  const noId = JSON.stringify({ installed: { client_secret: FIXTURE_CLIENT_SECRET } });
  assert.throws(
    () => parseOAuthClient(noId, FIXTURE_PATH),
    (error: Error) => {
      assert.match(error.message, /"installed\.client_id" is missing or not a string/);
      return true;
    },
  );
});

test("(f) parseOAuthClient names the missing client_secret field", () => {
  const noSecret = JSON.stringify({ installed: { client_id: FIXTURE_CLIENT_ID } });
  assert.throws(
    () => parseOAuthClient(noSecret, FIXTURE_PATH),
    (error: Error) => {
      assert.match(error.message, /"installed\.client_secret" is missing or not a string/);
      return true;
    },
  );
});

test("(g) paths compose under the injected home dir, never a literal separator", () => {
  const home = path.join("test-home", "designer");
  assert.strictEqual(credentialsDir(home), path.join(home, CREDENTIALS_DIR_NAME));
  assert.strictEqual(
    oauthClientPath(home),
    path.join(home, CREDENTIALS_DIR_NAME, OAUTH_CLIENT_FILENAME),
  );
  assert.strictEqual(tokenPath(home), path.join(home, CREDENTIALS_DIR_NAME, TOKEN_FILENAME));
});

test("(h) readOAuthClient names the absolute path and the fix when the file is absent", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "saci-drive-cred-"));
  const missing = path.join(dir, OAUTH_CLIENT_FILENAME);
  await assert.rejects(
    () => readOAuthClient(missing),
    (error: Error) => {
      assert.ok(error.message.includes(missing));
      assert.match(error.message, /^No OAuth client file at /);
      assert.match(error.message, /Internal/);
      assert.match(error.message, /Desktop app/);
      return true;
    },
  );
});

test("(i) readStoredToken returns null when the token file does not exist", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "saci-drive-cred-"));
  assert.strictEqual(await readStoredToken(path.join(dir, TOKEN_FILENAME)), null);
});

test("(j) token round-trips through write and read, keeping only known fields", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "saci-drive-cred-"));
  const file = path.join(dir, TOKEN_FILENAME);
  await writeStoredToken(file, {
    access_token: "test-access-token",
    refresh_token: "test-refresh-token",
    scope: "test-scope",
    expiry_date: 1234,
  });
  assert.deepStrictEqual(await readStoredToken(file), {
    access_token: "test-access-token",
    refresh_token: "test-refresh-token",
    scope: "test-scope",
    expiry_date: 1234,
  });
});

test("(k) writeStoredToken creates the credentials dir when it is absent", async () => {
  const home = await mkdtemp(path.join(tmpdir(), "saci-drive-home-"));
  const dir = credentialsDir(home);
  const file = path.join(dir, TOKEN_FILENAME);
  await writeStoredToken(file, { refresh_token: "test-refresh-token" });
  assert.deepStrictEqual(await readStoredToken(file), { refresh_token: "test-refresh-token" });
});

// POSIX modes only. On win32 the mode argument is inert, so asserting it there would
// pass without proving anything — the test declares itself skipped instead. The mode
// path is therefore UNVERIFIED on the one platform this adapter has live evidence
// from; see notes.md §7.
const POSIX_ONLY = process.platform === "win32" ? "POSIX file modes are inert on win32" : false;

test("(l) the token file and the dir it creates are owner-only", { skip: POSIX_ONLY }, async () => {
  const home = await mkdtemp(path.join(tmpdir(), "saci-drive-home-"));
  const dir = credentialsDir(home);
  const file = path.join(dir, TOKEN_FILENAME);
  await writeStoredToken(file, { refresh_token: "test-refresh-token" });
  assert.strictEqual((await stat(file)).mode & 0o777, 0o600);
  assert.strictEqual((await stat(dir)).mode & 0o777, 0o700);
});

test("(m) ensureCredentialsDir leaves an existing dir alone", async () => {
  const home = await mkdtemp(path.join(tmpdir(), "saci-drive-home-"));
  const dir = credentialsDir(home);
  await ensureCredentialsDir(dir);
  await ensureCredentialsDir(dir);
  assert.ok((await stat(dir)).isDirectory());
});

test("(n) readStoredToken fails loud on a malformed token file", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "saci-drive-cred-"));
  const file = path.join(dir, TOKEN_FILENAME);
  await writeFile(file, "{ not json", "utf8");
  await assert.rejects(
    () => readStoredToken(file),
    (error: Error) => {
      assert.match(error.message, /Malformed JSON in token file/);
      assert.ok(error.message.includes(file));
      return true;
    },
  );
});
