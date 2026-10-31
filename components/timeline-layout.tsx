// The waveform and the answer timeline sit in one horizontal scroll container
// and line up only because they share this scale and label column.

const PIXELS_PER_SECOND = 24;

export const LABEL_COLUMN_CLASS_NAME =
  "sticky left-0 z-20 w-24 shrink-0 border-r border-border bg-background md:w-32";

export function toPixels(ms: number): number {
  return (ms / 1000) * PIXELS_PER_SECOND;
}

export function Playhead({ ms }: { ms: number }) {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-y-0 z-10 w-px bg-foreground"
      style={{ left: toPixels(ms) }}
    />
  );
}
