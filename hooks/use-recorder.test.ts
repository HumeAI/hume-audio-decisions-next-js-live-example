// @vitest-environment jsdom
import type { Decisions } from "@humeai/audio-decisions";
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { askDecisions } from "@/lib/decisions";
import { type Microphone, openMicrophone } from "@/lib/microphone";
import { DEFAULT_CONTEXT, DEFAULT_QUESTIONS } from "@/lib/questions";
import { CHUNK_MS, MAX_RECORDING_MS } from "@/lib/recording";

import { useRecorder } from "./use-recorder";

vi.mock("@/lib/decisions");
vi.mock("@/lib/microphone");

const SAMPLE_RATE = 1_000;

const ANSWER: Decisions.DecisionsResponse = {
  runId: "run",
  answers: {},
  received: { inputTokens: 0 },
};

/** A microphone that sends one chunk of silence at a time when told to. */
function mockMicrophone() {
  const close = vi.fn();
  let onAudio: ((samples: Float32Array, sampleRate: number) => void) | null =
    null;
  vi.mocked(openMicrophone).mockImplementationOnce((callbacks) => {
    onAudio = callbacks.onAudio;
    return Promise.resolve({ sampleRate: SAMPLE_RATE, close });
  });

  return {
    close,
    sendChunk: () => {
      act(() => {
        onAudio?.(
          new Float32Array((CHUNK_MS / 1000) * SAMPLE_RATE),
          SAMPLE_RATE,
        );
      });
    },
  };
}

beforeEach(() => {
  // jsdom has no Web Audio API, and a stopped recording keeps its audio in an
  // AudioBuffer.
  vi.stubGlobal(
    "AudioBuffer",
    class {
      copyToChannel = vi.fn();
    },
  );
  vi.mocked(askDecisions).mockReturnValue(new Promise(() => undefined));
});

// Testing Library unmounts after each test on its own only when the test
// functions are globals, which this project does not turn on.
afterEach(() => {
  cleanup();
});

describe("useRecorder", () => {
  it("keeps a replaced recording's late answers out of the new recording", async () => {
    const lateAnswer = Promise.withResolvers<Decisions.DecisionsResponse>();
    vi.mocked(askDecisions).mockReturnValueOnce(lateAnswer.promise);
    const first = mockMicrophone();
    const second = mockMicrophone();
    const { result } = renderHook(() => useRecorder());

    await act(() => result.current.start(DEFAULT_QUESTIONS, DEFAULT_CONTEXT));
    first.sendChunk();
    await act(() => result.current.start(DEFAULT_QUESTIONS, DEFAULT_CONTEXT));
    second.sendChunk();
    await act(async () => {
      lateAnswer.resolve(ANSWER);
      await lateAnswer.promise;
    });

    expect(result.current.recording?.chunks).toEqual([
      expect.objectContaining({ index: 0, result: { status: "pending" } }),
    ]);
  });

  it("releases the microphone when it unmounts while the browser asks for access", async () => {
    const access = Promise.withResolvers<Microphone>();
    vi.mocked(openMicrophone).mockReturnValueOnce(access.promise);
    const close = vi.fn();
    const { result, unmount } = renderHook(() => useRecorder());

    let started = Promise.resolve();
    act(() => {
      started = result.current.start(DEFAULT_QUESTIONS, DEFAULT_CONTEXT);
    });
    unmount();
    access.resolve({ sampleRate: SAMPLE_RATE, close });
    await started;

    expect(close).toHaveBeenCalledOnce();
  });

  it("stops at the time limit, after sending the last chunk", async () => {
    const microphone = mockMicrophone();
    const { result } = renderHook(() => useRecorder());

    await act(() => result.current.start(DEFAULT_QUESTIONS, DEFAULT_CONTEXT));
    for (let ms = 0; ms < MAX_RECORDING_MS; ms += CHUNK_MS) {
      microphone.sendChunk();
    }

    expect(askDecisions).toHaveBeenCalledTimes(MAX_RECORDING_MS / CHUNK_MS);
    expect(microphone.close).toHaveBeenCalledOnce();
    expect(result.current.status).toBe("idle");
  });
});
