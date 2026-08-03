// Policy constants for the Drive adapter (R7). Every value here is closed by the
// 046 spike or by brief 047 — none of them is a tuning knob to be guessed at.

/**
 * The OAuth scope pair proven live in the 046 spike (question 3), in the order
 * the probe requested them: write only what this app creates, read structure.
 * Changing this list invalidates the stored token — see G-DRIVE-1.
 */
export const DRIVE_SCOPES: readonly string[] = [
  "https://www.googleapis.com/auth/drive.file",
  "https://www.googleapis.com/auth/drive.metadata.readonly",
];

/** Credential dir leaf under the user's home dir; shares the task-036 identity dir (D5). */
export const CREDENTIALS_DIR_NAME = ".saci";
/** Desktop-app OAuth client JSON, placed by hand (D5). Never enters the repo. */
export const OAUTH_CLIENT_FILENAME = "oauth_client.json";
/** Token cache written by the loopback flow (D5). Never enters the repo. */
export const TOKEN_FILENAME = "token.json";

/** Drive's folder MIME type — the marker that distinguishes a folder from a file. */
export const FOLDER_MIME_TYPE = "application/vnd.google-apps.folder";
/** Upload MIME type when the file extension maps to nothing known. */
export const DEFAULT_UPLOAD_MIME_TYPE = "application/octet-stream";

/** Field mask for a single-item read (`files.get`), per the 046 probe. */
export const ITEM_FIELDS = "id, name, mimeType";
/** Field mask for a child listing (`files.list`), per the 046 probe. */
export const CHILD_LIST_FIELDS = "files(id, name, mimeType)";
/**
 * Page size for the child-by-name listing: one match plus one, which is exactly
 * enough to tell "found" from "ambiguous" without paging further. A correctness
 * lower bound, not a tuning knob — at 1, two same-named siblings arrive as a single
 * row and `findChild` answers "found" instead of throwing, which is the one failure
 * the verify-never-create policy cannot recover from. `gateway.test.ts` (e) fails,
 * with that reason printed, if this drops below 2.
 */
export const CHILD_PAGE_SIZE = 2;

/** Path the loopback OAuth redirect lands on; the port is ephemeral. */
export const LOOPBACK_CALLBACK_PATH = "/oauth2callback";
