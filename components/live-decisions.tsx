"use client";

import { usePlayback } from "@/hooks/use-playback";
import { useRecorder } from "@/hooks/use-recorder";
import { useStoredState } from "@/hooks/use-stored-state";
import { DEFAULT_CONTEXT, DEFAULT_QUESTIONS } from "@/lib/questions";
import { latestSettledChunk } from "@/lib/recording";

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
  const playback = usePlayback(recording?.audio ?? null);
  const isCapturing = recorder.status !== "idle";
  const chunks = recording?.chunks ?? [];
  const durationMs = recording?.durationMs ?? 0;

  // While recording, the playhead marks the live edge, so the newest answers
  // show.
  const playheadMs = isCapturing
    ? (recording?.durationMs ?? null)
    : playback.playheadMs;
  const currentChunk = latestSettledChunk(chunks, playheadMs ?? Infinity);

  function record() {
    playback.reset();
    void recorder.start(questions, context);
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
            durationMs={durationMs}
            positionMs={playback.playheadMs}
            error={recorder.error}
            onRecord={record}
            onStop={recorder.stop}
            onTogglePlayback={playback.togglePlayback}
          />
        </div>

        <TimelineScroller>
          <Waveform
            levels={recording?.levels ?? []}
            durationMs={durationMs}
            playheadMs={playheadMs}
            followPlayhead={isCapturing || playback.isPlaying}
            onSeek={isCapturing ? undefined : playback.seek}
          />
          {/* Before the first recording, the rows follow the questions being
              edited, so the timeline keeps its shape when recording starts. */}
          <AnswerTimeline
            questions={recording?.questions ?? questions}
            chunks={chunks}
            durationMs={durationMs}
            currentChunk={currentChunk}
            playheadMs={playheadMs}
            onSeek={isCapturing ? undefined : playback.seek}
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
