import { useEffect, useRef, useState } from "react";

/** Plays recorded audio and tracks where in it the playhead is. */
export function usePlayback(audio: AudioBuffer | null) {
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
    if (!audio) {
      return;
    }
    halt();
    const durationMs = audio.duration * 1000;
    const startMs = fromMs < durationMs ? fromMs : 0;

    const context = new AudioContext();
    const source = new AudioBufferSourceNode(context, { buffer: audio });
    source.connect(context.destination);
    source.start(0, startMs / 1000);
    const startedAt = context.currentTime;

    let frame = requestAnimationFrame(function tick() {
      setPlayheadMs(startMs + (context.currentTime - startedAt) * 1000);
      frame = requestAnimationFrame(tick);
    });

    stopPlayerRef.current = () => {
      source.onended = null;
      cancelAnimationFrame(frame);
      void context.close();
    };
    source.onended = () => {
      halt();
      setPlayheadMs(durationMs);
    };
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
      if (isPlaying) {
        play(ms);
      } else {
        setPlayheadMs(ms);
      }
    },
    reset: () => {
      halt();
      setPlayheadMs(null);
    },
  };
}
