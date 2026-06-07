// Shared domain value types for @saci/core.

/**
 * Provenance of a resolved copy URL, in precedence order:
 * `"sister"` (a sibling copywriter task under the same parent),
 * `"parent"` (the parent task's description),
 * `"fallback"` (no copy URL found).
 */
export type CopySource = "sister" | "parent" | "fallback";
