import { useId } from "react";

import { MAX_CONTEXT_LENGTH } from "@/lib/questions";

interface ContextFieldProps {
  context: string;
  onContextChange: (context: string) => void;
  /** Set while recording, since every chunk is sent with the same context. */
  disabled: boolean;
}

export function ContextField({
  context,
  onContextChange,
  disabled,
}: ContextFieldProps) {
  const ids = useId();

  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between">
        <label htmlFor={`${ids}-context`} className="text-sm font-semibold">
          Context
        </label>
        <p id={`${ids}-count`} className="text-xs text-muted tabular-nums">
          {context.length.toLocaleString("en-US")} /{" "}
          {MAX_CONTEXT_LENGTH.toLocaleString("en-US")}
        </p>
      </div>
      <textarea
        id={`${ids}-context`}
        rows={3}
        maxLength={MAX_CONTEXT_LENGTH}
        value={context}
        disabled={disabled}
        onChange={(event) => {
          onContextChange(event.target.value);
        }}
        aria-describedby={`${ids}-hint ${ids}-count`}
        className="w-full resize-none rounded-lg border border-border bg-transparent px-3 py-2 text-sm disabled:opacity-60"
      />
      <p id={`${ids}-hint`} className="hidden text-sm text-muted md:block">
        Optional. Describes the setting, which the model reads with the audio.
      </p>
    </div>
  );
}
