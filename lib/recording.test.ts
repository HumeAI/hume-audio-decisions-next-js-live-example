import { describe, expect, it } from "vitest";

import {
  type Chunk,
  type ChunkAudio,
  type ChunkResult,
  createChunker,
  latestSettledChunk,
} from "./recording";

const ANSWERED: ChunkResult = {
  status: "answered",
  response: { runId: "run", answers: {}, received: { inputTokens: 0 } },
};

function chunk(index: number, result: ChunkResult): Chunk {
  return {
    index,
    startMs: index * 5_000,
    endMs: (index + 1) * 5_000,
    result,
  };
}

describe("latestSettledChunk", () => {
  it("keeps the previous answers while the newest chunk is pending", () => {
    const chunks = [chunk(0, ANSWERED), chunk(1, { status: "pending" })];

    expect(latestSettledChunk(chunks, Infinity)).toBe(chunks[0]);
  });

  it("shows a failed chunk until the next answers arrive", () => {
    const chunks = [
      chunk(0, ANSWERED),
      chunk(1, { status: "failed", message: "Failed." }),
      chunk(2, { status: "pending" }),
    ];

    expect(latestSettledChunk(chunks, Infinity)).toBe(chunks[1]);
  });

  it("follows the playhead to the chunk it is in", () => {
    const chunks = [chunk(0, ANSWERED), chunk(1, ANSWERED)];

    expect(latestSettledChunk(chunks, 4_999)).toBe(chunks[0]);
    expect(latestSettledChunk(chunks, 5_000)).toBe(chunks[1]);
  });
});

/**
 * Feeds the chunker blocks the way the microphone sends them. Each block's
 * samples hold its position, so a chunk shows which blocks it was made from.
 */
function capture(sampleRate: number, blockFrames: number, blockCount: number) {
  const addBlock = createChunker();
  const chunks: ChunkAudio[] = [];
  for (let block = 0; block < blockCount; block++) {
    const chunk = addBlock(
      new Float32Array(blockFrames).fill(block),
      sampleRate,
    );
    if (chunk) {
      chunks.push(chunk);
    }
  }
  return chunks.map(({ index, startMs, endMs, samples }) => ({
    index,
    startMs,
    endMs,
    firstBlock: samples[0],
    lastBlock: samples.at(-1),
  }));
}

describe("createChunker", () => {
  it("sends each full 5 seconds and holds back the rest", () => {
    // 12 seconds of 48 kHz audio in blocks of an eighth of a second.
    expect(capture(48_000, 6_000, 96)).toEqual([
      { index: 0, startMs: 0, endMs: 5_000, firstBlock: 0, lastBlock: 39 },
      {
        index: 1,
        startMs: 5_000,
        endMs: 10_000,
        firstBlock: 40,
        lastBlock: 79,
      },
    ]);
  });

  it("ends a chunk with the block that reaches 5 seconds", () => {
    // At 44.1 kHz an eighth of a second is 5,512.5 frames, so the blocks are
    // 5,513 frames and 40 of them come to slightly more than 5 seconds.
    const [first, second] = capture(44_100, 5_513, 88);

    expect(first?.endMs).toBeCloseTo(5_000.45);
    expect(second).toMatchObject({ startMs: first?.endMs, firstBlock: 40 });
  });
});
