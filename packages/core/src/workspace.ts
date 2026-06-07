// Workspace and TaskManifest domain type contracts (2026-05-28 design,
// authoritative). Plain field-documented types — no methods, no I/O.

import type { Issue } from "./payload.js";

/** Lifecycle event kinds a task workspace passes through. */
export type WorkspaceEventType = "start" | "ship" | "load" | "handoff";

/** A single timestamped entry in a task's event history. */
export interface WorkspaceEvent {
  /** Which lifecycle transition this entry records. */
  type: WorkspaceEventType;
  /** When the event occurred (ISO timestamp). */
  at: string;
}

/**
 * A production workspace for one Jira issue. Five facets keyed by the Jira key;
 * no methods, no I/O. Pure state captured at and during production.
 */
export interface Workspace {
  /** Jira issue key this workspace belongs to (the identity key). */
  jiraKey: string;
  /** Absolute local filesystem path of the task folder. */
  localFolderPath: string;
  /** Identifier of the template applied to seed the folder. */
  appliedTemplate: string;
  /** Current production state of the task (e.g. in-progress, shipped). */
  productionState: string;
  /** Drive path where the task's assets/manifest are stored. */
  drivePath: string;
  /** The task manifest describing how this workspace was produced. */
  manifest: TaskManifest;
}

/**
 * The manifest captured for a task: a snapshot of intent at start plus the
 * record of what happened. Documented field contracts only; no behavior.
 */
export interface TaskManifest {
  /** The Jira issue as captured when the workspace was started. */
  issueSnapshot: Issue;
  /** Identifier of the template used to seed the workspace. */
  templateUsed: string;
  /** Drive path where the task's assets/manifest live. */
  drivePath: string;
  /** Ordered history of start / ship / load / handoff events. */
  eventHistory: WorkspaceEvent[];
  /**
   * Optional concurrency-defense marker naming who claimed the task.
   * Semantics are Phase 3; defined as optional with no behavior attached here.
   */
  claimed_by?: string;
}
