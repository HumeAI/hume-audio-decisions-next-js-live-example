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
import { SidePanel } from "./side-panel";
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
      <SidePanel
        title={`Questions (${String(questions.length)})`}
        footer={
          <ContextField
            context={context}
            onContextChange={setContext}
            disabled={isCapturing}
          />
        }
      >
        <QuestionPanel
          questions={questions}
          onQuestionsChange={setQuestions}
          disabled={isCapturing}
        />
      </SidePanel>

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

        {/* Before the first recording, the rows follow the questions being
            edited, so the timeline keeps its shape when recording starts. */}
        <TimelineScroller>
          <Waveform
            levels={recording?.levels ?? []}
            durationMs={recording?.durationMs ?? 0}
            playheadMs={playheadMs}
            followPlayhead={isCapturing || playback.isPlaying}
            onSeek={isCapturing ? undefined : playback.seek}
            emptyText={`Press Record and speak. Every ${String(CHUNK_MS / 1000)} seconds of audio is sent with your questions.`}
          />
          <AnswerTimeline
            questions={recording?.questions ?? questions}
            chunks={recording?.chunks ?? []}
            durationMs={recording?.durationMs ?? 0}
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

        <AnswerPanel
          chunk={currentChunk}
          questions={recording?.questions ?? []}
        />
      </div>
    </main>
  );
}
