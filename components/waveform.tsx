import { useMemo } from "react";

import { formatTime } from "@/lib/format-time";
import { BLOCKS_PER_SECOND } from "@/lib/recording";

import { LABEL_COLUMN_CLASS_NAME, Playhead, toPixels } from "./timeline-layout";

const BAR_STEP = toPixels(1000 / BLOCKS_PER_SECOND);

interface WaveformProps {
  /** The loudness of each block of audio, from 0 to 1, drawn as one bar each. */
  levels: number[];
  durationMs: number;
  playheadMs: number | null;
  /** Keeps the playhead in view as it moves. */
  followPlayhead: boolean;
  /** Moves the playhead. Leave it out to turn seeking off. */
  onSeek?: (ms: number) => void;
}

export function Waveform({
  levels,
  durationMs,
  playheadMs,
  followPlayhead,
  onSeek,
}: WaveformProps) {
  const width = toPixels(durationMs);
  // The view box is 100 units tall and stretches to the element's height, so a
  // level of 1 fills it. Silence keeps a minimum height to stay visible.
  const path = useMemo(
    () =>
      levels
        .map((level, index) => {
          const x = (index + 0.5) * BAR_STEP;
          const half = Math.max(1, level * 50);
          return `M${String(x)} ${String(50 - half)}V${String(50 + half)}`;
        })
        .join(""),
    [levels],
  );

  return (
    <div className="sticky top-0 z-30 flex border-b border-border bg-background">
      <div
        className={`${LABEL_COLUMN_CLASS_NAME} px-3 text-sm leading-20 font-medium`}
      >
        Audio
      </div>
      <div
        className="relative h-20 shrink-0 has-[:focus-visible]:outline-2 has-[:focus-visible]:-outline-offset-2 has-[:focus-visible]:outline-foreground"
        style={{ width }}
      >
        <svg
          aria-hidden
          width={width}
          viewBox={`0 0 ${String(width)} 100`}
          preserveAspectRatio="none"
          className="h-full text-muted"
        >
          <path d={path} stroke="currentColor" strokeWidth={BAR_STEP - 1} />
        </svg>
        {onSeek && (
          <input
            type="range"
            aria-label="Playback position"
            min={0}
            max={durationMs}
            step={100}
            value={playheadMs ?? 0}
            aria-valuetext={formatTime(playheadMs ?? 0)}
            onChange={(event) => {
              onSeek(Number(event.target.value));
            }}
            className="absolute inset-0 h-full w-full cursor-pointer appearance-none opacity-0"
          />
        )}
        {playheadMs !== null && (
          <Playhead ms={playheadMs} follow={followPlayhead} />
        )}
      </div>
    </div>
  );
}
