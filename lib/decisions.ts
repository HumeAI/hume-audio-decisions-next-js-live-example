import type { Decisions } from "@humeai/audio-decisions";

import { API_SAMPLE_RATE, resample } from "./audio";
import type { ChunkResult } from "./recording";
import { encodeWav } from "./wav";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

// The route answers a failure with `{ message, body }`, where `body` is the
// API's own error when the API rejected the request.
function failureMessage(body: unknown, status: number): string {
  if (isRecord(body)) {
    if (isRecord(body.body) && typeof body.body.message === "string") {
      return body.body.message;
    }
    if (typeof body.message === "string") {
      return body.message;
    }
  }
  return `The request failed with status ${String(status)}.`;
}

/**
 * Sends one chunk of audio to the app's API route, which calls the Decisions
 * API with the SDK so the API key never reaches the browser.
 */
export async function askDecisions(
  samples: Float32Array<ArrayBuffer>,
  sampleRate: number,
  request: Decisions.DecisionsRequest,
  signal: AbortSignal,
): Promise<ChunkResult> {
  try {
    const audio = await resample(samples, sampleRate, API_SAMPLE_RATE);
    const form = new FormData();
    form.append("file", encodeWav(audio, API_SAMPLE_RATE), "chunk.wav");
    form.append("request", JSON.stringify(request));

    const response = await fetch("/api/decisions", {
      method: "POST",
      body: form,
      signal,
    });
    const body: unknown = await response.json();
    return response.ok
      ? { status: "answered", response: body as Decisions.DecisionsResponse }
      : { status: "failed", message: failureMessage(body, response.status) };
  } catch (error) {
    return {
      status: "failed",
      message: error instanceof Error ? error.message : String(error),
    };
  }
}
