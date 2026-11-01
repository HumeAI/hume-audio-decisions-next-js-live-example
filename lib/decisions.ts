import type { Decisions } from "@humeai/audio-decisions";

import { API_SAMPLE_RATE, resample } from "./audio";
import { errorBodyMessage } from "./error-body";
import { encodeWav } from "./wav";

/**
 * Sends one chunk of audio to the app's API route, which calls the Decisions
 * API with the SDK so the API key never reaches the browser.
 */
export async function askDecisions(
  samples: Float32Array<ArrayBuffer>,
  sampleRate: number,
  request: Decisions.DecisionsRequest,
  signal: AbortSignal,
): Promise<Decisions.DecisionsResponse> {
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
    // A body other than the route's own, such as an error page from the
    // server, is reported by its status.
    const body: unknown = await response.json().catch(() => null);
    throw new Error(
      errorBodyMessage(body) ??
        `The request failed with status ${String(response.status)}.`,
    );
  }
  return (await response.json()) as Decisions.DecisionsResponse;
}
