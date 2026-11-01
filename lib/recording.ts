import type { Decisions } from "@humeai/audio-decisions";

import { concatenate } from "./audio";
import type { NamedQuestion } from "./questions";

export const CHUNK_MS = 5_000;

/**
 * Recording stops on its own after this long, which limits the requests a
 * forgotten tab sends and the audio it holds in memory.
 */
export const MAX_RECORDING_MS = 5 * 60_000;

/** How often captured audio arrives, which is also one bar of the waveform. */
export const BLOCKS_PER_SECOND = 8;

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

/** The audio of one chunk, and where it falls in the recording. */
export interface ChunkAudio {
  index: number;
  startMs: number;
  endMs: number;
  samples: Float32Array<ArrayBuffer>;
}

/**
 * Collects captured blocks into chunks of at least `CHUNK_MS`. The returned
 * function takes each block and returns the chunk it completes, if any.
 *
 * Blocks are never split, so a chunk runs slightly long when its blocks do not
 * add up to exactly `CHUNK_MS`.
 */
export function createChunker() {
  let blocks: Float32Array[] = [];
  let startFrame = 0;
  let endFrame = 0;
  let index = 0;

  return function addBlock(
    samples: Float32Array,
    sampleRate: number,
  ): ChunkAudio | null {
    blocks.push(samples);
    endFrame += samples.length;
    if (endFrame - startFrame < (CHUNK_MS / 1000) * sampleRate) {
      return null;
    }

    const toMs = (frames: number) => (frames / sampleRate) * 1000;
    const chunk: ChunkAudio = {
      index: index++,
      startMs: toMs(startFrame),
      endMs: toMs(endFrame),
      samples: concatenate(blocks),
    };
    blocks = [];
    startFrame = endFrame;
    return chunk;
  };
}

export interface Recording {
  /**
   * The questions the recording was asked with, which stay fixed while the
   * questions being edited for the next recording change.
   */
  questions: NamedQuestion[];
  /**
   * The captured audio at the microphone's own rate, ready to play once
   * capture stops.
   */
  audio: AudioBuffer | null;
  /** The loudness of each block, from 0 to 1. */
  levels: number[];
  chunks: Chunk[];
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
