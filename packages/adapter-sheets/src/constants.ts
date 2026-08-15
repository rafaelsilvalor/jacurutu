// Policy constants for the Sheets adapter (R7). Every value here is either proven by
// the 2026-08-15 spike or closed by a brief decision — with exactly one exception,
// CLEAR_RANGE, which says so where it is declared rather than in a doc nobody opens.

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
 * THIS LITERAL IS NOT MEASURED. The 2026-08-15 spike never called `values.clear`, so
 * no evidence covers whether Google accepts `A:ZZZ` against a default grid. What
 * closes it is the live smoke's shrinking step — a second, shorter run must leave no
 * row of the first run visible. If Google rejects this range as exceeding grid
 * limits, narrow it and record both the rejected and the accepted form; never drop
 * the clear. `values.update` writes over only the cells the new grid covers and
 * leaves everything below untouched, so without the clear a run with fewer rows
 * shows the previous run's tail inside a report the team reads as current.
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
