import { describe, expect, it } from "vitest";

import { type Chunk, type ChunkResult, latestSettledChunk } from "./recording";

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
