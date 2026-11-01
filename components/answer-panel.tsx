import { useId } from "react";

import { formatTime } from "@/lib/format-time";
import type { NamedQuestion } from "@/lib/questions";
import type { Chunk } from "@/lib/recording";

import { AnswerCard } from "./answer-card";

interface AnswerPanelProps {
  chunk: Chunk | undefined;
  /** The questions the chunk was asked with. */
  questions: NamedQuestion[];
}

export function AnswerPanel({ chunk, questions }: AnswerPanelProps) {
  const headingId = useId();

  return (
    <section
      aria-labelledby={headingId}
      className="flex min-h-0 flex-1 flex-col gap-3 p-4"
    >
      <div className="flex items-baseline justify-between gap-4">
        <h2
          id={headingId}
          aria-live="polite"
          className="text-sm font-semibold tabular-nums"
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
      return null;
    case "failed":
      return (
        <p className="text-sm text-red-600 dark:text-red-400">
          {chunk.result.message}
        </p>
      );
    case "answered": {
      const { answers } = chunk.result.response;
      return (
        <div className="grid min-h-0 auto-rows-min grid-cols-[repeat(auto-fill,minmax(15rem,1fr))] gap-3 overflow-y-auto">
          {questions.map((question) => (
            <AnswerCard
              key={question.id}
              question={question}
              answer={answers[question.id]}
            />
          ))}
        </div>
      );
    }
  }
}
