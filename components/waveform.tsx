import { LABEL_COLUMN_CLASS_NAME, Playhead, toPixels } from "./timeline-layout";

interface WaveformProps {
  /** The loudness of each slice of audio, from 0 to 1, drawn as one bar each. */
  peaks: number[];
  durationMs: number;
  playheadMs: number | null;
}

export function Waveform({ peaks, durationMs, playheadMs }: WaveformProps) {
  const width = toPixels(durationMs);
  const step = width / peaks.length;
  // The view box is 100 units tall and stretches to the element's height, so a
  // peak of 1 fills it. Silence keeps a minimum height to stay visible.
  const path = peaks
    .map((peak, index) => {
      const x = (index + 0.5) * step;
      const half = Math.max(1, peak * 50);
      return `M${String(x)} ${String(50 - half)}V${String(50 + half)}`;
    })
    .join("");

  return (
    <div className="flex border-b border-border">
      <div
        className={`${LABEL_COLUMN_CLASS_NAME} px-3 text-sm leading-20 font-medium`}
      >
        Audio
      </div>
      <div className="relative h-20 shrink-0" style={{ width }}>
        {peaks.length > 0 && (
          <svg
            aria-hidden
            width={width}
            viewBox={`0 0 ${String(width)} 100`}
            preserveAspectRatio="none"
            className="h-full text-muted"
          >
            <path
              d={path}
              stroke="currentColor"
              strokeWidth={Math.max(1, step - 1)}
            />
          </svg>
        )}
        {playheadMs !== null && <Playhead ms={playheadMs} />}
      </div>
    </div>
  );
}
