import {
  DotFillIcon,
  PauseIcon,
  PlayIcon,
  SquareFillIcon,
} from "@primer/octicons-react";
import { useState } from "react";

import type { RecorderStatus } from "@/hooks/use-recorder";
import { useStoredState } from "@/hooks/use-stored-state";
import { formatTime } from "@/lib/format-time";

import { Button } from "./button";
import { NewRecordingDialog } from "./new-recording-dialog";

function formatSeconds(ms: number): string {
  return formatTime(Math.floor(ms / 1000) * 1000);
}

interface RecordingControlsProps {
  status: RecorderStatus;
  hasRecording: boolean;
  /** False while a field would get the request rejected; that field says why. */
  canRecord: boolean;
  isPlaying: boolean;
  durationMs: number;
  /** Where the playhead is, once the recording has been played or sought. */
  positionMs: number | null;
  error: string | null;
  /** Starts a new recording, replacing any earlier one. */
  onRecord: () => void;
  onStop: () => void;
  onTogglePlayback: () => void;
}

export function RecordingControls({
  status,
  hasRecording,
  canRecord,
  isPlaying,
  durationMs,
  positionMs,
  error,
  onRecord,
  onStop,
  onTogglePlayback,
}: RecordingControlsProps) {
  const [isConfirming, setIsConfirming] = useState(false);
  const [skipConfirmation, setSkipConfirmation] = useStoredState(
    "localStorage",
    "audio-decisions-live:skip-new-recording-confirmation",
    false,
  );
  const isRecording = status === "recording";

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
          <SquareFillIcon />
          Stop
        </Button>
      ) : (
        <Button
          variant="primary"
          disabled={status === "starting" || !canRecord}
          onClick={handleRecord}
        >
          <DotFillIcon className="text-red-500" />
          {status === "starting" ? "Starting" : "Record"}
        </Button>
      )}

      {hasRecording && !isRecording && (
        <Button onClick={onTogglePlayback}>
          {isPlaying ? <PauseIcon /> : <PlayIcon />}
          {/* Both words take up the same cell, so the button keeps the width
              of the longer one as it toggles. */}
          <span className="grid text-left">
            <span
              className={`col-start-1 row-start-1 ${isPlaying ? "invisible" : ""}`}
            >
              Play
            </span>
            <span
              className={`col-start-1 row-start-1 ${isPlaying ? "" : "invisible"}`}
            >
              Pause
            </span>
          </span>
        </Button>
      )}

      <p className="ml-auto flex items-center gap-2 text-sm tabular-nums">
        {isRecording && (
          <span
            aria-hidden
            className="size-2 animate-pulse rounded-full bg-red-500 motion-reduce:animate-none"
          />
        )}
        <span>
          {positionMs !== null && !isRecording && (
            <span className="text-muted">{formatSeconds(positionMs)} / </span>
          )}
          {formatSeconds(durationMs)}
        </span>
      </p>
      <p role="status" className="sr-only">
        {isRecording ? "Recording" : ""}
      </p>
      {error && (
        <p role="alert" className="basis-full text-sm text-danger">
          {error}
        </p>
      )}

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
