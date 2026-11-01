import { useEffect, useRef, useState } from "react";

import { concatenate, loudness, toAudioBuffer } from "@/lib/audio";
import { askDecisions } from "@/lib/decisions";
import {
  type Microphone,
  microphoneErrorMessage,
  openMicrophone,
} from "@/lib/microphone";
import { buildRequest, type NamedQuestion } from "@/lib/questions";
import { type Chunk, CHUNK_MS, type Recording } from "@/lib/recording";

export type RecorderStatus = "idle" | "starting" | "recording";

interface Session {
  /** Stops capturing. Answers for chunks already sent still arrive. */
  stop: () => void;
  /** Stops capturing and ignores every answer still on its way. */
  discard: () => void;
}

/**
 * Records the microphone and sends every 5 seconds of audio to the Decisions
 * API as soon as it is captured, without waiting for earlier answers.
 */
export function useRecorder() {
  const [recording, setRecording] = useState<Recording | null>(null);
  const [status, setStatus] = useState<RecorderStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const sessionRef = useRef<Session | null>(null);

  useEffect(
    () => () => {
      sessionRef.current?.discard();
    },
    [],
  );

  async function start(questions: NamedQuestion[], context: string) {
    sessionRef.current?.discard();
    const controller = new AbortController();
    const { signal } = controller;
    const request = buildRequest(questions, context);
    let microphone: Microphone | null = null;
    let blocks: Float32Array[] = [];
    let chunkBlocks: Float32Array[] = [];
    let chunkStartFrame = 0;
    let capturedFrames = 0;
    let nextIndex = 0;

    // Answers for a discarded recording can still arrive after a new one has
    // started, and must not land in it.
    function update(change: (current: Recording) => Recording) {
      if (!signal.aborted) {
        setRecording((current) => current && change(current));
      }
    }

    function sendChunk(sampleRate: number) {
      const toMs = (frames: number) => (frames / sampleRate) * 1000;
      const chunk: Chunk = {
        index: nextIndex++,
        startMs: toMs(chunkStartFrame),
        endMs: toMs(capturedFrames),
        result: { status: "pending" },
      };
      const samples = concatenate(chunkBlocks);
      chunkBlocks = [];
      chunkStartFrame = capturedFrames;
      update((current) => ({ ...current, chunks: [...current.chunks, chunk] }));

      void askDecisions(samples, sampleRate, request, signal).then((result) => {
        update((current) => ({
          ...current,
          chunks: current.chunks.map((existing) =>
            existing.index === chunk.index ? { ...existing, result } : existing,
          ),
        }));
      });
    }

    function receiveAudio(samples: Float32Array, sampleRate: number) {
      blocks.push(samples);
      chunkBlocks.push(samples);
      capturedFrames += samples.length;
      const level = loudness(samples);
      const durationMs = (capturedFrames / sampleRate) * 1000;
      update((current) => ({
        ...current,
        levels: [...current.levels, level],
        durationMs,
      }));

      if (capturedFrames - chunkStartFrame >= (CHUNK_MS / 1000) * sampleRate) {
        sendChunk(sampleRate);
      }
    }

    // Only full chunks are sent, so audio after the last one is kept for
    // playback but never answered.
    function stop() {
      if (!microphone) {
        return;
      }
      const { sampleRate } = microphone;
      microphone.close();
      microphone = null;
      setStatus("idle");

      // An AudioBuffer cannot be empty, which the audio is when capture stops
      // before the first block arrives.
      if (blocks.length > 0) {
        const audio = toAudioBuffer(concatenate(blocks), sampleRate);
        update((current) => ({ ...current, audio }));
      }
      // The session is kept until the next recording starts, so the blocks
      // would otherwise stay in memory alongside the buffer.
      blocks = [];
    }

    sessionRef.current = {
      stop,
      discard: () => {
        controller.abort();
        stop();
      },
    };
    setRecording(null);
    setError(null);
    setStatus("starting");

    try {
      microphone = await openMicrophone({
        onAudio: receiveAudio,
        onEnded: stop,
      });
    } catch (cause) {
      if (!signal.aborted) {
        setError(microphoneErrorMessage(cause));
        setStatus("idle");
      }
      return;
    }

    // The recorder unmounted while the browser was still asking for microphone
    // access.
    if (signal.aborted) {
      microphone.close();
      return;
    }

    setRecording({
      questions,
      audio: null,
      levels: [],
      chunks: [],
      durationMs: 0,
    });
    setStatus("recording");
  }

  return {
    recording,
    status,
    error,
    start,
    stop: () => sessionRef.current?.stop(),
  };
}
