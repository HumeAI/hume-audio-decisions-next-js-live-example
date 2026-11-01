import { useId } from "react";

import { formatTime } from "@/lib/format-time";
import type { NamedQuestion } from "@/lib/questions";
import { CHUNK_MS, type Chunk } from "@/lib/recording";

import { AnswerCard } from "./answer-card";

interface AnswerPanelProps {
  chunk: Chunk | undefined;
  /** The questions the chunk was asked with. */
  questions: NamedQuestion[];
}

export function AnswerPanel({ chunk, questions }: AnswerPanelProps) {
  const headingId = useId();

  // A fixed height keeps the timeline the same size with or without answers.
  // It fits the cards of the default questions, and more cards scroll. The
  // bottom padding matches the side panel's, so the cards end level with the
  // context field.
  return (
    <section
      aria-labelledby={headingId}
      className="flex h-[26rem] max-h-[55%] shrink-0 flex-col gap-3 p-4 md:pb-12"
    >
      <div className="flex items-baseline justify-between gap-4">
        <h2
          id={headingId}
          aria-live="polite"
          className="text-base font-semibold tabular-nums"
        >
          {chunk
            ? `Answers for ${formatTime(chunk.startMs)} to ${formatTime(chunk.endMs)}`
            : "Answers"}
        </h2>
        {chunk?.result.status === "answered" && (
          <p className="truncate text-xs text-muted">
            Run ID{" "}
            <span className="select-all">{chunk.result.response.runId}</span>
          </p>
        )}
      </div>
      <AnswerBody chunk={chunk} questions={questions} />
    </section>
  );
}

function AnswerBody({ chunk, questions }: AnswerPanelProps) {
  switch (chunk?.result.status) {
    case undefined:
    case "pending":
      return (
        <p className="text-sm text-muted">
          Answers for each {CHUNK_MS / 1000} seconds of audio show up here.
        </p>
      );
    case "failed":
      return (
        <p className="text-sm text-red-600 dark:text-red-400">
          {chunk.result.message}
        </p>
      );
    case "answered": {
      const { answers } = chunk.result.response;
      return (
        // The last row of each card takes the spare height, so the cards
        // reach the bottom of the panel.
        <div className="grid min-h-0 flex-1 auto-rows-[min-content_min-content_1fr] grid-cols-[repeat(auto-fill,minmax(18rem,1fr))] gap-4 overflow-y-auto">
          {questions.map((question, index) => (
            <AnswerCard
              key={question.id}
              question={question}
              number={index + 1}
              answer={answers[question.id]}
            />
          ))}
        </div>
      );
    }
  }
}
