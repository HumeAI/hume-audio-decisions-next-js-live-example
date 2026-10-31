import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  buildRequest,
  DEFAULT_CONTEXT,
  DEFAULT_QUESTIONS,
} from "@/lib/questions";

import { POST } from "./route";

const AUDIO = new Blob([new Uint8Array(44)], { type: "audio/wav" });
const REQUEST = JSON.stringify(
  buildRequest(DEFAULT_QUESTIONS, DEFAULT_CONTEXT),
);

function postChunk(parts: {
  file?: Blob;
  request?: string;
}): Promise<Response> {
  const form = new FormData();
  if (parts.file) {
    form.append("file", parts.file, "chunk.wav");
  }
  if (parts.request !== undefined) {
    form.append("request", parts.request);
  }
  return POST(
    new Request("http://localhost/api/decisions", {
      method: "POST",
      body: form,
    }),
  );
}

/** Stands in for the Decisions API, which the SDK reaches with `fetch`. */
function stubApi(status: number, body: unknown) {
  const api = vi.fn(() => Promise.resolve(Response.json(body, { status })));
  vi.stubGlobal("fetch", api);
  return api;
}

beforeEach(() => {
  vi.stubEnv("HUME_API_KEY", "test-key");
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("POST /api/decisions", () => {
  it("returns the API's answers in the SDK's shape", async () => {
    stubApi(200, {
      run_id: "run-1",
      answers: { speaking: { type: "noul", noul: 0.9 } },
    });

    const response = await postChunk({ file: AUDIO, request: REQUEST });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      runId: "run-1",
      answers: { speaking: { type: "noul", noul: 0.9 } },
    });
  });

  it("answers an API failure with its status and the API's message", async () => {
    stubApi(401, { message: "Invalid or expired API key." });

    const response = await postChunk({ file: AUDIO, request: REQUEST });

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({
      message: "Invalid or expired API key.",
    });
  });

  it("answers 400 without calling the API when the audio is missing", async () => {
    const api = stubApi(200, {});

    const response = await postChunk({ request: REQUEST });

    expect(response.status).toBe(400);
    expect(api).not.toHaveBeenCalled();
  });

  it("answers 400 without calling the API when a question does not match the schema", async () => {
    const api = stubApi(200, {});

    const response = await postChunk({
      file: AUDIO,
      request: JSON.stringify({ questions: { speaking: { type: "unknown" } } }),
    });

    expect(response.status).toBe(400);
    expect(api).not.toHaveBeenCalled();
  });
});
