import { useState } from "react";

import { formatTime } from "@/lib/format-time";

import { Button } from "./button";
import { NewRecordingDialog } from "./new-recording-dialog";

interface RecordingControlsProps {
  isRecording: boolean;
  hasRecording: boolean;
  isPlaying: boolean;
  elapsedMs: number;
  /** Starts a new recording, replacing any earlier one. */
  onRecord: () => void;
  onStop: () => void;
  onTogglePlayback: () => void;
  onClear: () => void;
}

export function RecordingControls({
  isRecording,
  hasRecording,
  isPlaying,
  elapsedMs,
  onRecord,
  onStop,
  onTogglePlayback,
  onClear,
}: RecordingControlsProps) {
  const [isConfirming, setIsConfirming] = useState(false);
  const [skipConfirmation, setSkipConfirmation] = useState(false);

  function handleRecord() {
    if (hasRecording && !skipConfirmation) {
      setIsConfirming(true);
    } else {
      onRecord();
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      {isRecording ? (
        <Button variant="primary" onClick={onStop}>
          <span aria-hidden className="size-2.5 rounded-xs bg-current" />
          Stop
        </Button>
      ) : (
        <Button variant="primary" onClick={handleRecord}>
          <span aria-hidden className="size-2.5 rounded-full bg-red-500" />
          Record
        </Button>
      )}

      {hasRecording && !isRecording && (
        <Button onClick={onTogglePlayback}>
          {isPlaying ? <PauseIcon /> : <PlayIcon />}
          {isPlaying ? "Pause" : "Play"}
        </Button>
      )}

      <Button disabled={!hasRecording || isRecording} onClick={onClear}>
        Clear
      </Button>

      <p className="ml-auto flex items-center gap-2 text-sm tabular-nums">
        {isRecording && (
          <span
            aria-hidden
            className="size-2 animate-pulse rounded-full bg-red-500 motion-reduce:animate-none"
          />
        )}
        {formatTime(Math.floor(elapsedMs / 1000) * 1000)}
      </p>
      <p role="status" className="sr-only">
        {isRecording ? "Recording" : ""}
      </p>

      {isConfirming && (
        <NewRecordingDialog
          onConfirm={(dontShowAgain) => {
            setSkipConfirmation(dontShowAgain);
            setIsConfirming(false);
            onRecord();
          }}
          onCancel={() => {
            setIsConfirming(false);
          }}
        />
      )}
    </div>
  );
}

function PlayIcon() {
  return (
    <svg aria-hidden viewBox="0 0 10 10" className="size-2.5 fill-current">
      <path d="M1 0.5v9l8-4.5z" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg aria-hidden viewBox="0 0 10 10" className="size-2.5 fill-current">
      <path d="M1 0.5h3v9H1zM6 0.5h3v9H6z" />
    </svg>
  );
}
