// The OAuth loopback (installed-app) flow, ported from the 046 probe. An existing
// token skips the browser entirely; a refreshed token is written back so the
// unattended designer flow keeps working (D6: the client is Internal, so the token
// carries no 7-day cap).
//
// Credential hygiene (binding — docs/explorations/drive-oauth.md §10): progress lines
// carry file paths, scope strings, and expiry metadata only. No token value and no
// client secret is ever logged. The authorization URL is printed because the user
// must open it, and the same line warns that it embeds the client id. The one library
// call here that can throw — the code-for-token exchange — is wrapped by
// `toConsentError`, so no library error leaves this module whole; its request body
// carries the authorization code in clear, which the library does not redact.
//
// Not unit tested by design (D4): the smoke covers it — the flow is a browser
// round-trip, and a fake of it would assert nothing about Google.

import http from "node:http";

import type { Credentials } from "google-auth-library";
import { google } from "googleapis";

import type { DriveAuthClient } from "./client.js";
import { DRIVE_SCOPES, LOOPBACK_CALLBACK_PATH } from "./constants.js";
import { toConsentError } from "./errors.js";
import {
  readOAuthClient,
  readStoredToken,
  writeStoredToken,
  type CredentialPaths,
  type OAuthClientCredentials,
  type StoredToken,
} from "./credentials.js";

/** Sink for progress lines. Defaults to stdout; the smoke and the CLI can redirect it. */
export type AuthorizeLog = (line: string) => void;

const defaultLog: AuthorizeLog = (line) => {
  console.log(line);
};

/** Construction inputs for `authorize`: where the credentials live, and where to report. */
export interface AuthorizeOptions {
  paths: CredentialPaths;
  log?: AuthorizeLog;
}

interface LoopbackServer {
  port: number;
  code: Promise<string>;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/** Copy a library credential set into the persisted shape, dropping nulls (R24). */
function toStoredToken(credentials: Credentials): StoredToken {
  const token: StoredToken = {};
  if (typeof credentials.access_token === "string") token.access_token = credentials.access_token;
  if (typeof credentials.refresh_token === "string") token.refresh_token = credentials.refresh_token;
  if (typeof credentials.scope === "string") token.scope = credentials.scope;
  if (typeof credentials.token_type === "string") token.token_type = credentials.token_type;
  if (typeof credentials.id_token === "string") token.id_token = credentials.id_token;
  if (typeof credentials.expiry_date === "number") token.expiry_date = credentials.expiry_date;
  return token;
}

/**
 * Listen on an ephemeral loopback port for the consent redirect. Resolves with the
 * port (needed to build the redirect URI) and a promise for the authorization code.
 * The server closes as soon as one callback lands, successful or not.
 */
function startLoopbackServer(): Promise<LoopbackServer> {
  return new Promise((ready) => {
    let settle!: { resolve: (code: string) => void; reject: (error: Error) => void };
    const code = new Promise<string>((resolve, reject) => {
      settle = { resolve, reject };
    });
    const server = http.createServer((request, response) => {
      const url = new URL(request.url ?? "/", "http://127.0.0.1");
      if (url.pathname !== LOOPBACK_CALLBACK_PATH) {
        response.writeHead(404);
        response.end();
        return;
      }
      response.writeHead(200, { "Content-Type": "text/plain" });
      response.end("Authorization response received. Return to the terminal.");
      server.close();
      const denied = url.searchParams.get("error");
      const granted = url.searchParams.get("code");
      if (denied) {
        settle.reject(new Error(`OAuth consent was denied: ${denied}`));
      } else if (!granted) {
        settle.reject(new Error("OAuth callback carried no code parameter"));
      } else {
        settle.resolve(granted);
      }
    });
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      const port = typeof address === "object" && address !== null ? address.port : 0;
      ready({ port, code });
    });
  });
}

/** Run the browser consent round-trip and persist the resulting token. */
async function runConsentFlow(
  credentials: OAuthClientCredentials,
  tokenFile: string,
  log: AuthorizeLog,
): Promise<StoredToken> {
  const { port, code } = await startLoopbackServer();
  const redirectUri = `http://127.0.0.1:${port}${LOOPBACK_CALLBACK_PATH}`;
  const client = new google.auth.OAuth2({
    clientId: credentials.clientId,
    clientSecret: credentials.clientSecret,
    redirectUri,
  });
  const authUrl = client.generateAuthUrl({
    access_type: "offline", // required for a refresh token to be issued
    prompt: "consent",
    scope: [...DRIVE_SCOPES],
  });
  log(`[drive-auth] loopback server listening on ${redirectUri}`);
  log("[drive-auth] open the URL below in a browser and authorize. Do not share it — it carries the client id:");
  log(authUrl);
  // Awaited outside the try on purpose: the two rejections `startLoopbackServer` raises
  // (consent denied, callback without a code) are ours, already specific, and carry no
  // request — wrapping them in a code-expiry hint would name the wrong cause.
  const authorizationCode = await code;
  let tokens: Credentials;
  try {
    ({ tokens } = await client.getToken(authorizationCode));
  } catch (error) {
    throw toConsentError(error);
  }
  const token = toStoredToken(tokens);
  await writeStoredToken(tokenFile, token);
  log(`[drive-auth] consent completed; token written to ${tokenFile}`);
  return token;
}

/**
 * Persist rotated tokens. The library emits `tokens` on every refresh; without this
 * the refreshed access token is lost when the process exits. A write failure is
 * logged, never swallowed (R4) — the call it accompanied still succeeds.
 */
function persistRefreshedTokens(
  client: DriveAuthClient,
  tokenFile: string,
  log: AuthorizeLog,
): void {
  client.on("tokens", (fresh: Credentials) => {
    const merged = toStoredToken({ ...client.credentials, ...fresh });
    writeStoredToken(tokenFile, merged).catch((error: unknown) => {
      log(`[drive-auth] failed to persist the refreshed token to ${tokenFile}: ${errorMessage(error)}`);
    });
  });
}

/** Report the grant: presence flags, expiry and scopes — never a token value. */
function logGrant(credentials: Credentials, log: AuthorizeLog): void {
  const expiry =
    typeof credentials.expiry_date === "number"
      ? new Date(credentials.expiry_date).toISOString()
      : "n/a";
  log(`[drive-auth] refresh token present: ${typeof credentials.refresh_token === "string"}`);
  log(`[drive-auth] access token expiry: ${expiry}`);
  log(`[drive-auth] granted scopes: ${credentials.scope ?? "(not recorded in the token)"}`);
}

/**
 * Return an authorized client, running the browser consent flow only when no usable
 * token exists. Missing-credential failures come from `credentials.ts` and already
 * name the file and the fix.
 */
export async function authorize(options: AuthorizeOptions): Promise<DriveAuthClient> {
  const log = options.log ?? defaultLog;
  const { oauthClientPath, tokenPath } = options.paths;
  const credentials = await readOAuthClient(oauthClientPath);
  const stored = await readStoredToken(tokenPath);

  const client = new google.auth.OAuth2({
    clientId: credentials.clientId,
    clientSecret: credentials.clientSecret,
  });
  persistRefreshedTokens(client, tokenPath, log);

  if (stored === null) {
    log(`[drive-auth] no token at ${tokenPath}; starting the consent flow`);
    client.setCredentials(await runConsentFlow(credentials, tokenPath, log));
  } else {
    client.setCredentials(stored);
    log(`[drive-auth] reusing the token at ${tokenPath} (no browser needed)`);
  }

  logGrant(client.credentials, log);
  return client;
}
