// Policy constants for the Sheets adapter (R7). Every value here is either proven by
// the 2026-08-15 spike, measured by the owner-run smoke of the same date, or closed by
// a brief decision — each saying which, where it is declared rather than in a doc
// nobody opens. CLEAR_RANGE was the one unmeasured literal; the smoke closed it.

/** Sheets API version: the surface `values.update` and `values.clear` live on. */
export const SHEETS_API_VERSION = "v4";

/** Drive API version, matching adapter-drive — creation and sharing are Drive calls. */
export const DRIVE_API_VERSION = "v3";

/** The MIME type that makes Drive store a created file as a native spreadsheet. */
export const SPREADSHEET_MIME_TYPE = "application/vnd.google-apps.spreadsheet";

/**
 * Anchor cell for `values.update`, deliberately NOT qualified with a sheet name. The
 * spike's transcript echoed `updatedRange = 'Página1'!A1:Q3`: the default sheet is
 * named in the account's locale, so `Sheet1!A1` addresses a sheet that does not exist
 * on a pt-BR account. An unqualified A1 range targets the first sheet (G-SHEETS-2).
 */
export const VALUES_RANGE = "A1";

/**
 * The range cleared before every write: whole columns of that same first sheet,
 * unqualified for the same locale reason as VALUES_RANGE.
 *
 * Measured on 2026-08-15 by the owner-run smoke of `docs/tasks/
 * 2026-08-15-adapter-sheets-report/`, steps 4 and 5: a header plus one row written
 * over a grid holding a header plus three read back as exactly two rows. Google
 * accepts `A:ZZZ` against a default grid, and clearing it removes what the previous
 * write left behind — the two stale rows were gone.
 *
 * Never drop the clear. `values.update` writes over only the cells the new grid
 * covers and leaves everything below untouched, so without it a run with fewer rows
 * shows the previous run's tail inside a report the team reads as current. If a
 * future grid ever makes Google reject this range for exceeding grid limits, narrow
 * it and record both the rejected and the accepted form.
 */
export const CLEAR_RANGE = "A:ZZZ";

/** Values are stored exactly as given; Sheets parses and reformats nothing. */
export const VALUE_INPUT_OPTION = "RAW";

/** Grantee kind, pinned: one workspace user is what the spike measured (D2). */
export const SHARE_TYPE = "user";

/** Grant level, pinned: reader is what the spike measured (D2). */
export const SHARE_ROLE = "reader";

/** Field mask for a created spreadsheet — `SpreadsheetRef` carries id and name only. */
export const ITEM_FIELDS = "id, name";

/** Field mask for a created permission, per the spike probe. */
export const PERMISSION_FIELDS = "id, type, role";
