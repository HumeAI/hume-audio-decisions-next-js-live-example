import { useEffect, useRef, useState } from "react";

import { concatenate } from "@/lib/audio";
import type { Recording } from "@/lib/recording";

/** Plays a finished recording and tracks where in it the playhead is. */
export function usePlayback(recording: Recording | null) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playheadMs, setPlayheadMs] = useState<number | null>(null);
  const stopPlayerRef = useRef<(() => void) | null>(null);

  useEffect(
    () => () => {
      stopPlayerRef.current?.();
    },
    [],
  );

  function halt() {
    stopPlayerRef.current?.();
    stopPlayerRef.current = null;
    setIsPlaying(false);
  }

  function play(fromMs: number) {
    if (!recording) {
      return;
    }
    halt();
    const { sampleRate, durationMs } = recording;
    const startMs = fromMs < durationMs ? fromMs : 0;
    const samples = concatenate(recording.audio);

    const context = new AudioContext();
    const buffer = new AudioBuffer({
      length: samples.length,
      numberOfChannels: 1,
      sampleRate,
    });
    buffer.copyToChannel(samples, 0);
    const source = new AudioBufferSourceNode(context, { buffer });
    source.connect(context.destination);
    source.start(0, startMs / 1000);
    const startedAt = context.currentTime;

    let frame = requestAnimationFrame(function tick() {
      setPlayheadMs(startMs + (context.currentTime - startedAt) * 1000);
      frame = requestAnimationFrame(tick);
    });

    function stopPlayer() {
      source.onended = null;
      cancelAnimationFrame(frame);
      void context.close();
    }

    source.onended = () => {
      stopPlayer();
      stopPlayerRef.current = null;
      setIsPlaying(false);
      setPlayheadMs(durationMs);
    };
    stopPlayerRef.current = stopPlayer;
    setPlayheadMs(startMs);
    setIsPlaying(true);
  }

  return {
    isPlaying,
    playheadMs,
    togglePlayback: () => {
      if (isPlaying) {
        halt();
      } else {
        play(playheadMs ?? 0);
      }
    },
    seek: (ms: number) => {
      setPlayheadMs(ms);
      if (isPlaying) {
        play(ms);
      }
    },
    reset: () => {
      halt();
      setPlayheadMs(null);
    },
  };
}
