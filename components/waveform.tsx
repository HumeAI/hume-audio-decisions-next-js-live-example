import { type CSSProperties, useMemo } from "react";

import { formatTime } from "@/lib/format-time";
import { BLOCKS_PER_SECOND, CHUNK_MS } from "@/lib/recording";

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
  /** Shown in place of the waveform until there is audio. */
  emptyText: string;
}

export function Waveform({
  levels,
  durationMs,
  playheadMs,
  followPlayhead,
  onSeek,
  emptyText,
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
    // The waveform takes any height the timeline has to spare, and keeps a
    // minimum when the question rows need the rest.
    <div className="sticky top-0 z-30 flex min-h-[clamp(4rem,12dvh,10rem)] flex-1 border-b bg-background">
      <div
        className={`${LABEL_COLUMN_CLASS_NAME} flex items-center px-3 text-sm font-medium`}
      >
        Audio
      </div>
      {durationMs === 0 ? (
        <p className="flex items-center px-3 text-sm text-muted">{emptyText}</p>
      ) : (
        <div
          className="relative h-full shrink-0 has-focus-visible:outline-2 has-focus-visible:-outline-offset-2 has-focus-visible:outline-foreground"
          style={{
            width,
            // A line at the end of every chunk, in line with the edges of the
            // chunk columns below.
            backgroundImage:
              "linear-gradient(to left, var(--border) 1px, transparent 1px)",
            backgroundSize: `${String(toPixels(CHUNK_MS))}px 100%`,
          }}
        >
          <Bars path={path} width={width} className="text-muted/40" />
          {/* The played part is drawn again on top in a darker gray, cut off
              at the playhead. */}
          <Bars
            path={path}
            width={width}
            className="absolute inset-y-0 left-0 text-muted"
            style={{
              clipPath: `inset(0 ${String(width - toPixels(playheadMs ?? 0))}px 0 0)`,
            }}
          />
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
      )}
    </div>
  );
}

function Bars({
  path,
  width,
  className,
  style,
}: {
  path: string;
  width: number;
  className: string;
  style?: CSSProperties;
}) {
  return (
    <svg
      aria-hidden
      width={width}
      viewBox={`0 0 ${String(width)} 100`}
      preserveAspectRatio="none"
      className={`h-full ${className}`}
      style={style}
    >
      <path d={path} stroke="currentColor" strokeWidth={BAR_STEP - 1} />
    </svg>
  );
}
