"use client";

import { usePlayback } from "@/hooks/use-playback";
import { useRecorder } from "@/hooks/use-recorder";
import { useStoredState } from "@/hooks/use-stored-state";
import { DEFAULT_CONTEXT, DEFAULT_QUESTIONS } from "@/lib/questions";
import { CHUNK_MS, latestSettledChunk } from "@/lib/recording";

import { AnswerPanel } from "./answer-panel";
import { AnswerTimeline } from "./answer-timeline";
import { ContextField } from "./context-field";
import { QuestionPanel } from "./question-panel";
import { RecordingControls } from "./recording-controls";
import { TimelineScroller } from "./timeline-layout";
import { Waveform } from "./waveform";

export function LiveDecisions() {
  // Kept for the browser tab, so a refresh keeps them and a new tab starts
  // from the defaults.
  const [questions, setQuestions] = useStoredState(
    "sessionStorage",
    "audio-decisions-live:questions",
    DEFAULT_QUESTIONS,
  );
  const [context, setContext] = useStoredState(
    "sessionStorage",
    "audio-decisions-live:context",
    DEFAULT_CONTEXT,
  );
  const recorder = useRecorder();
  const { recording } = recorder;
  const playback = usePlayback(recording);
  const isCapturing = recorder.status !== "idle";

  // While recording, the playhead marks the live edge and the newest answers
  // are shown. Afterwards, the answers follow the playhead.
  const playheadMs = isCapturing
    ? (recording?.durationMs ?? null)
    : playback.playheadMs;
  const currentChunk = latestSettledChunk(
    recording?.chunks ?? [],
    isCapturing ? Infinity : (playback.playheadMs ?? Infinity),
  );

  function record() {
    playback.reset();
    void recorder.start(questions, context);
  }

  function clear() {
    playback.reset();
    recorder.clear();
  }

  return (
    <main className="flex min-h-0 flex-1 flex-col md:flex-row">
      <aside className="flex max-h-[40dvh] shrink-0 flex-col border-b border-border md:max-h-none md:w-80 md:border-r md:border-b-0">
        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          <QuestionPanel
            questions={questions}
            onQuestionsChange={setQuestions}
            disabled={isCapturing}
          />
        </div>
        <div className="shrink-0 border-t border-border p-4">
          <ContextField
            context={context}
            onContextChange={setContext}
            disabled={isCapturing}
          />
        </div>
      </aside>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <div className="p-4">
          <RecordingControls
            status={recorder.status}
            hasRecording={recording !== null}
            isPlaying={playback.isPlaying}
            durationMs={recording?.durationMs ?? 0}
            positionMs={playback.playheadMs}
            error={recorder.error}
            onRecord={record}
            onStop={recorder.stop}
            onTogglePlayback={playback.togglePlayback}
            onClear={clear}
          />
        </div>

        {recording ? (
          <TimelineScroller>
            <Waveform
              levels={recording.levels}
              durationMs={recording.durationMs}
              playheadMs={playheadMs}
              followPlayhead={isCapturing || playback.isPlaying}
              onSeek={isCapturing ? undefined : playback.seek}
            />
            <AnswerTimeline
              questions={recording.questions}
              chunks={recording.chunks}
              durationMs={recording.durationMs}
              currentChunk={currentChunk}
              playheadMs={playheadMs}
              onSelectChunk={
                isCapturing
                  ? undefined
                  : (chunk) => {
                      playback.seek(chunk.startMs);
                    }
              }
            />
          </TimelineScroller>
        ) : (
          <p className="flex h-40 shrink-0 items-center justify-center border-y border-border px-4 text-center text-sm text-muted">
            Press Record and speak. Every {CHUNK_MS / 1000} seconds of audio is
            sent with your questions.
          </p>
        )}

        <AnswerPanel
          chunk={currentChunk}
          questions={recording?.questions ?? []}
        />
      </div>
    </main>
  );
}
