// Phase 1 placeholder. Real domain code lands in Phase 2 (lib_transform.py port).
export const SACI_CORE_PHASE = 1;

export {
  normalizeText,
  slugNomeCurto,
  parseVertical,
  parseEntrega,
  extractFirstDriveUrl,
  tokensForPairing,
  STOPWORDS_SLUG,
  STOPWORDS_PAIRING,
} from "./transform.js";

export type { CopySource } from "./types.js";

export {
  summaryTokens,
  bestMatchByTokenOverlap,
  pickCopy,
  STOPWORDS_PT,
} from "./policy.js";

export type {
  Issue,
  FilteredOut,
  PayloadWarning,
  Payload,
} from "./payload.js";

export { assemblePayload, SCHEMA_VERSION } from "./assemble.js";

export type { PayloadMeta } from "./assemble.js";

export type {
  JiraGateway,
  SheetGateway,
  DriveGateway,
  DriveItem,
} from "./gateways.js";

export {
  EXPORT_COLUMNS,
  jiraBrowseUrl,
  projectIssue,
  matchesFilters,
  applyColumns,
} from "./export.js";

export type {
  ExportColumnId,
  ExportRecord,
  ExportContext,
  ExportFilters,
  ColumnSpec,
  ColumnSelection,
} from "./export.js";

export {
  displayKey,
  HISTORY_EVENTS,
  parseManifest,
  serializeManifest,
  TASK_MANIFEST_SCHEMA_VERSION,
} from "./workspace.js";

export type { HistoryEntry, HistoryEvent, TaskManifest } from "./workspace.js";

export {
  derivePath,
  AVULSAS_BUCKET,
  MONTH_FORMAT,
  MONTH_SLICE_LEN,
  UNDATED_MONTH,
  UNKNOWN_VERTICAL,
} from "./derive-path.js";

export type { DerivePathInput } from "./derive-path.js";

export { buildEditableStem, sanitizeSlug, SLUG_MAX_LEN } from "./file-name.js";

export type { EditableStemInput } from "./file-name.js";
