import { InfoIcon } from "@primer/octicons-react";
import { useId } from "react";

import { FIELD_CLASS_NAME } from "./field";

interface ContextFieldProps {
  context: string;
  onContextChange: (context: string) => void;
  /** Set while recording, since every chunk is sent with the same context. */
  disabled: boolean;
  error: string | undefined;
}

export function ContextField({
  context,
  onContextChange,
  disabled,
  error,
}: ContextFieldProps) {
  const ids = useId();

  return (
    <div className="space-y-1.5">
      {/* The row is the tooltip's positioning box, so the tooltip spans the
          panel's width rather than overflowing from the icon. */}
      <div className="relative flex items-center gap-1.5">
        <label htmlFor={`${ids}-context`} className="font-semibold">
          Context
        </label>
        {/* A tap focuses the button, so the tooltip also opens on touch
            screens. */}
        <button
          type="button"
          aria-label="About context"
          aria-describedby={`${ids}-hint`}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.currentTarget.blur();
            }
          }}
          className="peer flex text-muted hover:text-foreground"
        >
          <InfoIcon />
        </button>
        <p
          id={`${ids}-hint`}
          role="tooltip"
          className="invisible absolute inset-x-0 bottom-full z-10 mb-2 rounded-lg bg-foreground px-3 py-2 text-sm text-background opacity-0 transition-opacity peer-hover:visible peer-hover:opacity-100 peer-focus:visible peer-focus:opacity-100"
        >
          Background information the model considers alongside the audio, such
          as the setting or who is speaking.
        </p>
      </div>
      <textarea
        id={`${ids}-context`}
        rows={3}
        value={context}
        disabled={disabled}
        onChange={(event) => {
          onContextChange(event.target.value);
        }}
        aria-invalid={error !== undefined}
        aria-describedby={error ? `${ids}-hint ${ids}-error` : `${ids}-hint`}
        className={`block ${FIELD_CLASS_NAME} resize-none disabled:opacity-60`}
      />
      {error && (
        <p id={`${ids}-error`} className="text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
