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
          <Headline value={level} details={[agreement(answer.confidence)]} />
          <ScoreColumns
            levels={levels.map((index) => [
              answer.legend[index] ?? index,
              answer.probabilities[index] ?? 0,
            ])}
            mean={answer.score}
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

/**
 * Each level as a column, lowest first. Columns rather than rows let the mean
 * level, which usually falls between two levels, be marked on an axis beneath
 * them.
 */
function ScoreColumns({
  levels,
  mean,
  emphasized,
}: {
  levels: [label: string, share: number][];
  mean: number;
  emphasized: string;
}) {
  // Level indices count from 0 and each sits at the center of its column.
  function center(level: number): string {
    return `${String(((level + 0.5) / levels.length) * 100)}%`;
  }
  // The mean's label goes on whichever side of its dot has more room.
  const labelStyle =
    mean < (levels.length - 1) / 2
      ? { left: `calc(${center(mean)} + 0.625rem)` }
      : { right: `calc(100% - ${center(mean)} + 0.625rem)` };

  return (
    <div>
      <ol className="flex">
        {levels.map(([label, share]) => {
          const isEmphasized = label === emphasized;
          return (
            <li
              key={label}
              className="flex min-w-0 flex-1 flex-col items-center gap-1 text-xs"
            >
              <span className="text-muted tabular-nums">{percent(share)}</span>
              <span
                aria-hidden
                className="flex h-12 w-2 items-end overflow-hidden rounded-full bg-border"
              >
                <span
                  className={`w-full rounded-full ${isEmphasized ? "bg-foreground" : "bg-muted/50"}`}
                  style={{ height: percent(share) }}
                />
              </span>
              <span
                title={label}
                className={`w-full truncate text-center ${isEmphasized ? "font-medium" : "text-muted"}`}
              >
                {label}
              </span>
            </li>
          );
        })}
      </ol>
      <div className="relative mt-1.5 h-4">
        <span
          aria-hidden
          className="absolute top-1/2 h-px bg-border"
          style={{ left: center(0), right: center(0) }}
        />
        <span
          aria-hidden
          className="absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-foreground"
          style={{ left: center(mean) }}
        />
        {/* The background hides the axis behind the label. */}
        <span
          className="absolute top-0 bg-background px-1 text-xs whitespace-nowrap text-muted tabular-nums"
          style={labelStyle}
        >
          Mean level {mean.toFixed(1)}
        </span>
      </div>
    </div>
  );
}
