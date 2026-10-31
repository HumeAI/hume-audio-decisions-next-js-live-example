"use client";

import { useState } from "react";

import { DEFAULT_CONTEXT, DEFAULT_QUESTIONS } from "@/lib/questions";
import {
  type Chunk,
  CHUNK_MS,
  latestSettledChunk,
  type Recording,
} from "@/lib/recording";
import { SAMPLE_RECORDING } from "@/lib/sample-data";

import { AnswerPanel } from "./answer-panel";
import { AnswerTimeline } from "./answer-timeline";
import { QuestionPanel } from "./question-panel";
import { RecordingControls } from "./recording-controls";
import { Waveform } from "./waveform";

export function LiveDecisions() {
  const [questions, setQuestions] = useState(DEFAULT_QUESTIONS);
  const [context, setContext] = useState(DEFAULT_CONTEXT);
  const [recording, setRecording] = useState<Recording | null>(
    SAMPLE_RECORDING,
  );
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playheadMs, setPlayheadMs] = useState<number | null>(null);

  // While recording, the newest answers are shown. Afterwards, the answers
  // follow the playhead, starting from the newest until a chunk is chosen.
  const shownPlayheadMs = isRecording ? null : playheadMs;
  const currentChunk = latestSettledChunk(
    recording?.chunks ?? [],
    shownPlayheadMs ?? Infinity,
  );

  function record() {
    setRecording({ questions, chunks: [], peaks: [], durationMs: 0 });
    setPlayheadMs(null);
    setIsPlaying(false);
    setIsRecording(true);
  }

  function clear() {
    setRecording(null);
    setPlayheadMs(null);
    setIsPlaying(false);
  }

  function selectChunk(chunk: Chunk) {
    setPlayheadMs(chunk.startMs);
  }

  return (
    <main className="flex min-h-0 flex-1 flex-col md:flex-row">
      <aside className="max-h-[40dvh] shrink-0 overflow-y-auto border-b border-border p-4 md:max-h-none md:w-80 md:border-r md:border-b-0">
        <QuestionPanel
          questions={questions}
          onQuestionsChange={setQuestions}
          context={context}
          onContextChange={setContext}
          disabled={isRecording}
        />
      </aside>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <div className="p-4">
          <RecordingControls
            isRecording={isRecording}
            hasRecording={recording !== null}
            isPlaying={isPlaying}
            elapsedMs={recording?.durationMs ?? 0}
            onRecord={record}
            onStop={() => {
              setIsRecording(false);
            }}
            onTogglePlayback={() => {
              setIsPlaying((playing) => !playing);
            }}
            onClear={clear}
          />
        </div>

        {recording ? (
          <div className="shrink-0 overflow-x-auto border-y border-border">
            <Waveform
              peaks={recording.peaks}
              durationMs={recording.durationMs}
              playheadMs={shownPlayheadMs}
            />
            <AnswerTimeline
              questions={recording.questions}
              chunks={recording.chunks}
              durationMs={recording.durationMs}
              currentChunk={currentChunk}
              playheadMs={shownPlayheadMs}
              onSelectChunk={selectChunk}
            />
          </div>
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
