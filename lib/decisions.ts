import type { Decisions } from "@humeai/audio-decisions";

import { API_SAMPLE_RATE, resample } from "./audio";
import type { ChunkResult } from "./recording";
import { encodeWav } from "./wav";

// The route answers a failure as `{ message }`. Anything else, such as an error
// page from the server, is reported by its status.
async function failureMessage(response: Response): Promise<string> {
  const body: unknown = await response.json().catch(() => null);
  return typeof body === "object" &&
    body !== null &&
    "message" in body &&
    typeof body.message === "string"
    ? body.message
    : `The request failed with status ${String(response.status)}.`;
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
    if (!response.ok) {
      return { status: "failed", message: await failureMessage(response) };
    }
    const answers = (await response.json()) as Decisions.DecisionsResponse;
    return { status: "answered", response: answers };
  } catch (error) {
    return {
      status: "failed",
      message: error instanceof Error ? error.message : String(error),
    };
  }
}
