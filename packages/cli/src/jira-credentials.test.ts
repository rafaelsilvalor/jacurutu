import { test } from "node:test";
import assert from "node:assert";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import {
  JIRA_CREDENTIALS_FILENAME,
  parseJiraCredentials,
  readJiraCredentials,
} from "./jira-credentials.js";

// Every value in this file is a PLACEHOLDER, never a credential (constraint 2):
// the site is `your-site`, the address is `example.com`, and the token is an
// angle-bracket description of the thing rather than a thing. No test here
// touches the network, the home directory, or a real credential (constraint 3).
const VALID = {
  baseUrl: "https://your-site.atlassian.net",
  email: "you@example.com",
  apiToken: "<your Atlassian API token>",
  expiresAt: "2027-08-19",
};

const FIELDS = ["baseUrl", "email", "apiToken", "expiresAt"];

const BASE_URL_VAR = "JACURUTU_JIRA_BASE_URL";
const EMAIL_VAR = "JACURUTU_JIRA_EMAIL";
const API_TOKEN_VAR = "JACURUTU_JIRA_API_TOKEN";

// parseJiraCredentials is pure — it never opens what it is handed — so the parse
// tests pass a LABEL path, composed with path.join (R1) and never created.
const LABEL_PATH = path.join(tmpdir(), "jacurutu-label", JIRA_CREDENTIALS_FILENAME);

/** Sandbox holding one credentials path; `content` seeds it, `null` leaves it missing. */
function makeSandbox(content: string | null): { base: string; filePath: string } {
  const base = mkdtempSync(path.join(tmpdir(), "jacurutu-jira-credentials-"));
  const filePath = path.join(base, JIRA_CREDENTIALS_FILENAME);
  if (content !== null) {
    writeFileSync(filePath, content);
  }
  return { base, filePath };
}

/** The valid document with one field removed. */
function withoutField(field: string): string {
  const record: Record<string, unknown> = { ...VALID };
  delete record[field];
  return JSON.stringify(record);
}

/** The valid document with one field replaced by `value`. */
function withField(field: string, value: unknown): string {
  return JSON.stringify({ ...VALID, [field]: value });
}

test("a well-formed credentials file resolves all four fields", async () => {
  const { base, filePath } = makeSandbox(JSON.stringify(VALID, null, 2));
  try {
    const credentials = await readJiraCredentials(filePath, {});
    assert.deepStrictEqual(credentials, VALID);
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
});

test("a missing file names the resolved path and shows the seed JSON", async () => {
  const { base, filePath } = makeSandbox(null);
  try {
    await assert.rejects(readJiraCredentials(filePath, {}), (error: Error) => {
      assert.ok(error.message.includes(`No Jira credentials file at ${filePath}`));
      assert.ok(error.message.includes("Create it with:"));
      // Field by field, so a seed that lost a line is visible rather than plausible.
      for (const field of FIELDS) {
        assert.ok(error.message.includes(`"${field}"`), `seed omits ${field}`);
      }
      return true;
    });
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
});

test("a missing file with two retired variables set names exactly those two (D2)", async () => {
  const { base, filePath } = makeSandbox(null);
  try {
    const env = { [BASE_URL_VAR]: "https://your-site.atlassian.net", [API_TOKEN_VAR]: "<a value>" };
    await assert.rejects(readJiraCredentials(filePath, env), (error: Error) => {
      assert.ok(error.message.includes(BASE_URL_VAR), "names the base-url var");
      assert.ok(error.message.includes(API_TOKEN_VAR), "names the api-token var");
      assert.ok(!error.message.includes(EMAIL_VAR), `named an unset var: ${error.message}`);
      assert.ok(error.message.includes("are set but no longer read"));
      // Names only: no value from the env reaches the message (constraint 2).
      assert.ok(!error.message.includes("<a value>"), "leaked a retired variable's value");
      return true;
    });
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
});

test("a missing file with one retired variable set uses the singular verb", async () => {
  const { base, filePath } = makeSandbox(null);
  try {
    const env = { [EMAIL_VAR]: "you@example.com" };
    await assert.rejects(readJiraCredentials(filePath, env), (error: Error) => {
      assert.ok(error.message.includes(`${EMAIL_VAR} is set but no longer read`));
      assert.ok(!error.message.includes(BASE_URL_VAR));
      assert.ok(!error.message.includes(API_TOKEN_VAR));
      return true;
    });
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
});

test("a missing file with no retired variable set carries no migration sentence", async () => {
  const { base, filePath } = makeSandbox(null);
  try {
    await assert.rejects(readJiraCredentials(filePath, {}), (error: Error) => {
      assert.ok(
        !error.message.includes("no longer read"),
        `unexpected migration line: ${error.message}`,
      );
      assert.ok(!error.message.includes("JACURUTU_JIRA_"), "named a variable nobody set");
      return true;
    });
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
});

test("malformed JSON fails loud naming the Jira credentials file", () => {
  assert.throws(
    () => parseJiraCredentials("{ not json", LABEL_PATH),
    (error: Error) => {
      assert.ok(
        error.message.startsWith(`Malformed JSON in Jira credentials file ${LABEL_PATH}: `),
      );
      return true;
    },
  );
});

test("a non-object document fails loud (array, string, number, null)", () => {
  for (const raw of ["[]", `"a string"`, "42", "null"]) {
    assert.throws(
      () => parseJiraCredentials(raw, LABEL_PATH),
      (error: Error) => {
        assert.strictEqual(
          error.message,
          `Jira credentials file ${LABEL_PATH} must hold a JSON object.`,
        );
        return true;
      },
      `accepted a non-object document: ${raw}`,
    );
  }
});

test("each missing field fails loud naming that field", () => {
  for (const field of FIELDS) {
    assert.throws(
      () => parseJiraCredentials(withoutField(field), LABEL_PATH),
      (error: Error) => {
        assert.strictEqual(
          error.message,
          `Jira credentials file ${LABEL_PATH}: ${field} must be a non-empty string.`,
        );
        return true;
      },
      `accepted a document with no ${field}`,
    );
  }
});

test("each wrong-typed field fails loud naming that field", () => {
  for (const field of FIELDS) {
    for (const wrong of [42, true, null, { nested: 1 }, ["a"]]) {
      assert.throws(
        () => parseJiraCredentials(withField(field, wrong), LABEL_PATH),
        (error: Error) => {
          assert.strictEqual(
            error.message,
            `Jira credentials file ${LABEL_PATH}: ${field} must be a non-empty string.`,
          );
          return true;
        },
        `accepted ${JSON.stringify(wrong)} for ${field}`,
      );
    }
  }
});

test("an empty or whitespace-only field fails loud naming that field", () => {
  for (const field of FIELDS) {
    for (const blank of ["", "   "]) {
      assert.throws(
        () => parseJiraCredentials(withField(field, blank), LABEL_PATH),
        (error: Error) => {
          assert.strictEqual(
            error.message,
            `Jira credentials file ${LABEL_PATH}: ${field} must be a non-empty string.`,
          );
          return true;
        },
        `accepted a blank ${field}`,
      );
    }
  }
});

test("a malformed expiresAt fails loud naming the YYYY-MM-DD form", () => {
  // The first three are the brief's cases: unpadded parts, a European
  // presentation form, and a month that does not exist. The last two are the
  // arithmetic a shape check alone cannot see.
  for (const bad of ["2027-8-9", "19/08/2027", "2027-13-01", "2027-00-10", "2027-02-30"]) {
    assert.throws(
      () => parseJiraCredentials(withField("expiresAt", bad), LABEL_PATH),
      (error: Error) => {
        assert.strictEqual(
          error.message,
          `Jira credentials file ${LABEL_PATH}: expiresAt must be a calendar date in YYYY-MM-DD form.`,
        );
        return true;
      },
      `accepted a malformed expiresAt: ${bad}`,
    );
  }
});

test("a PAST expiresAt parses successfully and blocks nothing (D3, D5)", () => {
  // An operator who rotated the token without updating the file has a working
  // credential and a stale date; refusing that run would block the one state the
  // recorded date exists to diagnose.
  const credentials = parseJiraCredentials(withField("expiresAt", "2019-01-02"), LABEL_PATH);
  assert.strictEqual(credentials.expiresAt, "2019-01-02");
});

test("a leap day parses and the same day in a common year does not", () => {
  const leap = parseJiraCredentials(withField("expiresAt", "2028-02-29"), LABEL_PATH);
  assert.strictEqual(leap.expiresAt, "2028-02-29");
  assert.throws(() => parseJiraCredentials(withField("expiresAt", "2027-02-29"), LABEL_PATH));
});
