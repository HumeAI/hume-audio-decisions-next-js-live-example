import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  buildRequest,
  DEFAULT_CONTEXT,
  DEFAULT_QUESTIONS,
} from "@/lib/questions";
import { encodeWav } from "@/lib/wav";

import { POST } from "./route";

// One second of silence, encoded the way the browser sends each chunk.
const AUDIO = encodeWav(new Float32Array(16_000), 16_000);
const REQUEST = JSON.stringify(
  buildRequest(DEFAULT_QUESTIONS, DEFAULT_CONTEXT),
);

function postChunk(request: string): Promise<Response> {
  const form = new FormData();
  form.append("file", AUDIO, "chunk.wav");
  form.append("request", request);
  return POST(
    new Request("http://localhost/api/decisions", {
      method: "POST",
      body: form,
    }),
  );
}

/**
 * Stands in for the Audio Decisions API, which the SDK reaches with `fetch`.
 */
function stubApi(status: number, body: unknown) {
  const api = vi.fn(() => Promise.resolve(Response.json(body, { status })));
  vi.stubGlobal("fetch", api);
  return api;
}

beforeEach(() => {
  vi.stubEnv("HUME_API_KEY", "test-key");
});

describe("POST /api/decisions", () => {
  it("returns the API's answers in the SDK's shape", async () => {
    stubApi(200, {
      run_id: "run-1",
      answers: { speaking: { type: "noul", noul: 0.9 } },
      received: { input_tokens: 1234 },
    });

    const response = await postChunk(REQUEST);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      runId: "run-1",
      answers: { speaking: { type: "noul", noul: 0.9 } },
      received: { inputTokens: 1234 },
    });
  });

  it("answers an API failure with its status and the API's message", async () => {
    stubApi(401, { message: "Invalid or expired API key." });

    const response = await postChunk(REQUEST);

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({
      message: "Invalid or expired API key.",
    });
  });

  it("answers 400 with a message when a question does not match the schema", async () => {
    stubApi(200, {});

    const response = await postChunk(
      JSON.stringify({ questions: { speaking: { type: "unknown" } } }),
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toHaveProperty("message");
  });
});
