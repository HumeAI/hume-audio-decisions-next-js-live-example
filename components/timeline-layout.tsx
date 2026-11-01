import { type ReactNode, useEffect, useRef } from "react";

// The waveform and the answer timeline sit in one horizontal scroll container
// and line up only because they share this scale and label column.

const PIXELS_PER_SECOND = 32;

export const LABEL_COLUMN_CLASS_NAME =
  "sticky left-0 z-20 w-24 shrink-0 border-r border-border bg-background md:w-32";

export function toPixels(ms: number): number {
  return (ms / 1000) * PIXELS_PER_SECOND;
}

export function TimelineScroller({ children }: { children: ReactNode }) {
  // The left scroll padding matches the label column, so a playhead scrolled
  // into view never ends up behind it.
  return (
    <div className="flex min-h-0 flex-1 scroll-pr-4 scroll-pl-24 flex-col overflow-auto border-y border-border md:scroll-pl-32">
      {children}
    </div>
  );
}

interface PlayheadProps {
  ms: number;
  /** Scrolls the timeline as the playhead moves so it stays in view. */
  follow?: boolean;
}

export function Playhead({ ms, follow = false }: PlayheadProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (follow) {
      ref.current?.scrollIntoView({ block: "nearest", inline: "nearest" });
    }
  }, [ms, follow]);

  return (
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none absolute inset-y-0 z-10 w-px bg-foreground"
      style={{ left: toPixels(ms) }}
    />
  );
}
