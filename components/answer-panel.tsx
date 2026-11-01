import type { Decisions } from "@humeai/audio-decisions";
import { CheckIcon, CopyIcon } from "@primer/octicons-react";
import { useId, useState } from "react";

import { formatTime } from "@/lib/format-time";
import type { NamedQuestion } from "@/lib/questions";
import type { Chunk } from "@/lib/recording";

import { AnswerCard } from "./answer-card";

interface AnswerPanelProps {
  chunk: Chunk | undefined;
  /** The questions the chunk was asked with, one card each. */
  questions: NamedQuestion[];
}

export function AnswerPanel({ chunk, questions }: AnswerPanelProps) {
  const headingId = useId();
  const result = chunk?.result;
  const response = result?.status === "answered" ? result.response : undefined;

  // The panel is as tall as its cards, and a card is as tall before its
  // answer arrives as after, so the timeline keeps its height when answers
  // arrive. The bottom padding matches the side panel's, so the cards end
  // level with the context field.
  return (
    <section
      aria-labelledby={headingId}
      className="flex max-h-[60%] shrink-0 flex-col gap-3 p-4 md:pb-16"
    >
      {/* The call details move below the heading when the row is too narrow
          for both, so the run ID is never cut off. */}
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 id={headingId} className="font-semibold">
          Answers{" "}
          {chunk && (
            <span className="text-xs font-normal text-muted tabular-nums">
              for {formatTime(chunk.startMs)} to {formatTime(chunk.endMs)}
            </span>
          )}
        </h2>
        {response && <CallDetails response={response} />}
        {result?.status === "failed" && (
          <p className="text-sm text-danger">{result.message}</p>
        )}
      </div>
      <div className="grid min-h-0 auto-rows-min grid-cols-[repeat(auto-fill,minmax(18rem,1fr))] gap-4 overflow-y-auto">
        {questions.map((question, index) => (
          <AnswerCard
            key={question.id}
            question={question}
            number={index + 1}
            answer={response?.answers[question.id]}
          />
        ))}
      </div>
    </section>
  );
}

function CallDetails({ response }: { response: Decisions.DecisionsResponse }) {
  return (
    <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 text-xs text-muted">
      <p className="tabular-nums">
        {response.received.inputTokens.toLocaleString()} input tokens
      </p>
      {/* The key resets the check mark when another chunk's answers show. */}
      <CopyRunId key={response.runId} runId={response.runId} />
    </div>
  );
}

function CopyRunId({ runId }: { runId: string }) {
  const [isCopied, setIsCopied] = useState(false);

  return (
    <>
      <button
        type="button"
        title="Copy run ID"
        onClick={() => {
          void navigator.clipboard.writeText(runId).then(() => {
            setIsCopied(true);
            setTimeout(() => {
              setIsCopied(false);
            }, 2000);
          });
        }}
        className="flex items-center gap-1.5 transition-colors hover:text-foreground"
      >
        Run ID {runId}
        {isCopied ? <CheckIcon size={12} /> : <CopyIcon size={12} />}
      </button>
      <p role="status" className="sr-only">
        {isCopied ? "Run ID copied" : ""}
      </p>
    </>
  );
}
