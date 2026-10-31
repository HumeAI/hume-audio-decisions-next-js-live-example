import type { Decisions } from "@humeai/decisions";

import type { NamedQuestion } from "./questions";

export const CHUNK_MS = 5_000;

export const PEAKS_PER_SECOND = 8;

export type ChunkResult =
  | { status: "pending" }
  | { status: "answered"; response: Decisions.DecisionsResponse }
  | { status: "failed"; message: string };

export interface Chunk {
  index: number;
  startMs: number;
  endMs: number;
  result: ChunkResult;
}

export interface Recording {
  /**
   * The questions the recording was asked with, which stay fixed while the
   * questions being edited for the next recording change.
   */
  questions: NamedQuestion[];
  chunks: Chunk[];
  /** The loudness of each slice of audio, from 0 to 1. */
  peaks: number[];
  durationMs: number;
}

/**
 * The latest chunk with a result among those that start by `ms`. A chunk still
 * waiting on the API is skipped, so the previous answers stay in view until
 * its answers arrive.
 */
export function latestSettledChunk(
  chunks: Chunk[],
  ms: number,
): Chunk | undefined {
  return chunks.findLast(
    (chunk) => chunk.result.status !== "pending" && chunk.startMs <= ms,
  );
}
