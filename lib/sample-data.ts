import type { Decisions } from "@humeai/decisions";

import { DEFAULT_QUESTIONS } from "./questions";
import {
  type Chunk,
  CHUNK_MS,
  PEAKS_PER_SECOND,
  type Recording,
} from "./recording";

// A stand-in recording for reviewing the interface without a microphone or an
// API key. Its answers match the default questions.

const DURATION_MS = 28_400;

function response(
  emotion: [number, number, number, number],
  speaking: number,
  energy: [number, number, number],
): Decisions.DecisionsResponse {
  const names = ["Happy", "Sad", "Angry", "Neutral"];
  const top = emotion.indexOf(Math.max(...emotion));
  return {
    runId: `run_${String(Math.round(speaking * 1e6))}`,
    answers: {
      emotion: {
        type: "choice",
        choice: names[top] ?? "Neutral",
        confidence: 0.62,
        probabilities: Object.fromEntries(
          names.map((name, index) => [name, emotion[index] ?? 0]),
        ),
      },
      speaking: { type: "noul", noul: speaking },
      energy: {
        type: "score",
        score: energy.reduce((sum, p, level) => sum + p * level, 0),
        confidence: 0.48,
        probabilities: { "0": energy[0], "1": energy[1], "2": energy[2] },
        legend: { "0": "Low", "1": "Moderate", "2": "High" },
      },
    },
  };
}

function chunk(index: number, result: Chunk["result"]): Chunk {
  return {
    index,
    startMs: index * CHUNK_MS,
    endMs: Math.min((index + 1) * CHUNK_MS, DURATION_MS),
    result,
  };
}

export const SAMPLE_RECORDING: Recording = {
  questions: DEFAULT_QUESTIONS,
  durationMs: DURATION_MS,
  peaks: Array.from(
    { length: Math.round((DURATION_MS / 1000) * PEAKS_PER_SECOND) },
    (_, index) => {
      const syllable = Math.abs(Math.sin(index * 0.9));
      const phrase = Math.max(0, Math.sin(index * 0.13));
      return 0.04 + 0.9 * syllable * phrase;
    },
  ),
  chunks: [
    chunk(0, {
      status: "answered",
      response: response([0.71, 0.04, 0.03, 0.22], 0.97, [0.08, 0.41, 0.51]),
    }),
    chunk(1, {
      status: "answered",
      response: response([0.58, 0.06, 0.05, 0.31], 0.93, [0.12, 0.55, 0.33]),
    }),
    chunk(2, {
      status: "failed",
      message:
        "The Decisions API did not respond within 60 seconds. Check your connection and record again.",
    }),
    chunk(3, {
      status: "answered",
      response: response([0.09, 0.12, 0.04, 0.75], 0.31, [0.62, 0.33, 0.05]),
    }),
    chunk(4, {
      status: "answered",
      response: response([0.07, 0.66, 0.05, 0.22], 0.88, [0.47, 0.44, 0.09]),
    }),
    chunk(5, { status: "pending" }),
  ],
};
