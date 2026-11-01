import type { Decisions } from "@humeai/audio-decisions";
import { CheckIcon, CopyIcon } from "@primer/octicons-react";
import { useEffect, useId, useState } from "react";

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
      className="flex h-[27rem] max-h-[60%] shrink-0 flex-col gap-3 p-4 md:pb-16"
    >
      {/* The call details move below the heading when the row is too narrow
          for both, so the run ID is never cut off. */}
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 id={headingId} aria-live="polite" className="font-semibold">
          Answers{" "}
          {chunk && (
            <span className="text-xs font-normal text-muted tabular-nums">
              for {formatTime(chunk.startMs)} to {formatTime(chunk.endMs)}
            </span>
          )}
        </h2>
        {chunk?.result.status === "answered" && (
          <CallDetails response={chunk.result.response} />
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
      return <p className="text-sm text-danger">{chunk.result.message}</p>;
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

function CallDetails({ response }: { response: Decisions.DecisionsResponse }) {
  return (
    <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 text-xs text-muted">
      <p className="tabular-nums">
        {response.received.inputTokens.toLocaleString()} input tokens
      </p>
      <CopyRunId runId={response.runId} />
    </div>
  );
}

function CopyRunId({ runId }: { runId: string }) {
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    if (!isCopied) {
      return;
    }
    const timeout = setTimeout(() => {
      setIsCopied(false);
    }, 2000);
    return () => {
      clearTimeout(timeout);
    };
  }, [isCopied]);

  return (
    <>
      <button
        type="button"
        title="Copy run ID"
        onClick={() => {
          void navigator.clipboard.writeText(runId).then(() => {
            setIsCopied(true);
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
