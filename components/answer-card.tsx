import type { Decisions } from "@humeai/audio-decisions";
import { useId } from "react";

import { percent, topLevel } from "@/lib/answers";
import {
  type LiveQuestion,
  type NamedQuestion,
  questionOptions,
} from "@/lib/questions";

import { QuestionLabel } from "./question-label";

interface AnswerCardProps {
  question: NamedQuestion;
  /** The question's position in the list, counting from 1. */
  number: number;
  answer: Decisions.Answer | undefined;
}

export function AnswerCard({ question, number, answer }: AnswerCardProps) {
  const titleId = useId();

  // A card spans three rows of the answer grid and shares them through a
  // subgrid, so the question, the answer and the bars each start at the same
  // height across a row of cards, even when one question wraps.
  return (
    <article
      aria-labelledby={titleId}
      className="row-span-3 grid grid-rows-subgrid gap-5 rounded-xl border border-border p-5"
    >
      <header className="space-y-1.5">
        <div className="flex items-baseline justify-between gap-3">
          <h3 id={titleId} className="truncate font-medium">
            <QuestionLabel id={question.id} number={number} />
          </h3>
          <p className="shrink-0 text-xs text-muted">
            {question.question.type}
          </p>
        </div>
        <p className="line-clamp-2 text-sm text-muted">
          {question.question.instructions}
        </p>
      </header>
      {answer ? (
        <AnswerDetail question={question.question} answer={answer} />
      ) : (
        <p className="text-sm text-muted">No answer was returned.</p>
      )}
    </article>
  );
}

function AnswerDetail({
  question,
  answer,
}: {
  question: LiveQuestion;
  answer: Decisions.Answer;
}) {
  switch (answer.type) {
    case "noul":
      return (
        <>
          <Headline
            value={percent(answer.noul)}
            details={["of raters would answer yes"]}
          />
          <Distribution
            items={[
              ["Yes", answer.noul],
              ["No", 1 - answer.noul],
            ]}
            emphasized="Yes"
          />
        </>
      );
    case "choice":
      return (
        <>
          <Headline
            value={answer.choice}
            details={[agreement(answer.confidence)]}
          />
          {/* Options follow the question's order, which is the order the
              model reads them in. */}
          <Distribution
            items={questionOptions(question).map((option) => [
              option,
              answer.probabilities[option] ?? 0,
            ])}
            emphasized={answer.choice}
          />
        </>
      );
    case "score": {
      // Levels are keyed by index, so they are ordered by number rather than
      // by the key order of the JSON object.
      const levels = Object.keys(answer.legend).sort(
        (a, b) => Number(a) - Number(b),
      );
      const level = topLevel(answer);
      return (
        <>
          <Headline
            value={level}
            details={[
              `Mean level ${answer.score.toFixed(1)} of 0 to ${String(levels.length - 1)}`,
              agreement(answer.confidence),
            ]}
          />
          <Distribution
            items={levels.map((index) => [
              answer.legend[index] ?? index,
              answer.probabilities[index] ?? 0,
            ])}
            emphasized={level}
          />
        </>
      );
    }
    default:
      // The API may add answer types, which are to be treated as unknown.
      return <p className="text-sm text-muted">Unrecognized answer type.</p>;
  }
}

// `confidence` measures how much raters would agree with each other, not how
// sure the model is.
function agreement(confidence: number): string {
  return `Rater agreement ${confidence.toFixed(2)}`;
}

function Headline({ value, details }: { value: string; details: string[] }) {
  return (
    <div>
      <p className="text-3xl font-semibold tracking-tight">{value}</p>
      {details.map((detail) => (
        <p key={detail} className="mt-1 text-sm text-muted tabular-nums">
          {detail}
        </p>
      ))}
    </div>
  );
}

/** Each option with its probability, emphasizing the one the answer names. */
function Distribution({
  items,
  emphasized,
}: {
  items: [label: string, share: number][];
  emphasized: string | undefined;
}) {
  return (
    <ul className="space-y-2.5">
      {items.map(([label, share]) => {
        const isEmphasized = label === emphasized;
        return (
          <li
            key={label}
            className="grid grid-cols-[minmax(0,7rem)_1fr_3rem] items-center gap-3 text-sm"
          >
            <span
              className={`truncate ${isEmphasized ? "font-medium" : "text-muted"}`}
            >
              {label}
            </span>
            <Bar share={share} emphasized={isEmphasized} />
            <span className="text-right text-muted tabular-nums">
              {percent(share)}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

function Bar({ share, emphasized }: { share: number; emphasized: boolean }) {
  return (
    <span
      aria-hidden
      className="block h-2 overflow-hidden rounded-full bg-border"
    >
      <span
        className={`block h-full rounded-full ${emphasized ? "bg-foreground" : "bg-muted/50"}`}
        style={{ width: percent(share) }}
      />
    </span>
  );
}
