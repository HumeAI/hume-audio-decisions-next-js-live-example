import type { Decisions } from "@humeai/audio-decisions";
import { useId } from "react";

import { percent, type ScoreLevel, scoreLevels } from "@/lib/answers";
import {
  type LiveQuestion,
  type NamedQuestion,
  questionOptions,
} from "@/lib/questions";

import { QuestionHeading } from "./question-label";

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
      className="row-span-3 grid grid-rows-subgrid gap-5 rounded-xl border p-5"
    >
      <header className="space-y-1.5">
        <QuestionHeading
          id={question.id}
          number={number}
          type={question.question.type}
          titleId={titleId}
        />
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
            detail="of raters would answer yes"
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
            detail={agreement(answer.confidence)}
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
      const { levels, top } = scoreLevels(answer);
      return (
        <>
          <Headline value={top.label} detail={agreement(answer.confidence)} />
          <ScoreColumns levels={levels} top={top} mean={answer.score} />
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

function Headline({ value, detail }: { value: string; detail: string }) {
  return (
    <div>
      <p className="text-3xl font-semibold tracking-tight">{value}</p>
      <p className="mt-1 text-sm text-muted tabular-nums">{detail}</p>
    </div>
  );
}

/** Each option with its probability, emphasizing the one the answer names. */
function Distribution({
  items,
  emphasized,
}: {
  items: [label: string, share: number][];
  emphasized: string;
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

function Bar({
  share,
  emphasized,
  vertical = false,
}: {
  share: number;
  emphasized: boolean;
  vertical?: boolean;
}) {
  return (
    <span
      aria-hidden
      className={`flex overflow-hidden rounded-full bg-border ${vertical ? "h-12 w-2 items-end" : "h-2"}`}
    >
      <span
        className={`rounded-full ${vertical ? "w-full" : "h-full"} ${emphasized ? "bg-foreground" : "bg-muted/50"}`}
        style={
          vertical ? { height: percent(share) } : { width: percent(share) }
        }
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
  top,
  mean,
}: {
  levels: ScoreLevel[];
  top: ScoreLevel;
  mean: number;
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
        {levels.map((level) => {
          const isTop = level === top;
          return (
            <li
              key={level.label}
              className="flex min-w-0 flex-1 flex-col items-center gap-1 text-xs"
            >
              <span className="text-muted tabular-nums">
                {percent(level.share)}
              </span>
              <Bar share={level.share} emphasized={isTop} vertical />
              <span
                title={level.label}
                className={`w-full truncate text-center ${isTop ? "font-medium" : "text-muted"}`}
              >
                {level.label}
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
