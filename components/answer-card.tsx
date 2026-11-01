import type { Decisions } from "@humeai/audio-decisions";
import { useId } from "react";

import { nearestLevel, summarizeAnswer } from "@/lib/answers";
import type { NamedQuestion } from "@/lib/questions";

import { TypePill } from "./type-pill";

function percent(share: number): string {
  return `${String(Math.round(share * 100))}%`;
}

interface AnswerCardProps {
  question: NamedQuestion;
  answer: Decisions.Answer | undefined;
}

export function AnswerCard({ question, answer }: AnswerCardProps) {
  const titleId = useId();

  // A card spans three rows of the answer grid and shares them through a
  // subgrid, so the question, the answer and the bars each start at the same
  // height across a row of cards, even when one question wraps.
  return (
    <article
      aria-labelledby={titleId}
      className="row-span-3 grid grid-rows-subgrid gap-4 rounded-xl border border-border p-4"
    >
      <header className="space-y-1">
        <div className="flex items-center justify-between gap-3">
          <h3 id={titleId} className="truncate text-sm font-medium">
            {question.id}
          </h3>
          <TypePill type={question.question.type} />
        </div>
        <p className="line-clamp-2 text-sm text-muted">
          {question.question.instructions}
        </p>
      </header>
      {answer ? (
        <AnswerDetail answer={answer} />
      ) : (
        <p className="text-sm text-muted">No answer was returned.</p>
      )}
    </article>
  );
}

function AnswerDetail({ answer }: { answer: Decisions.Answer }) {
  switch (answer.type) {
    case "noul":
      return (
        <>
          <Headline
            value={summarizeAnswer(answer)}
            detail={`${percent(answer.noul)} of raters would answer yes`}
          />
          {/* As tall as one row of a distribution, so this bar lines up with
              the first bar of the cards beside it. */}
          <div className="grid h-4 items-center">
            <Bar share={answer.noul} emphasized />
          </div>
        </>
      );
    case "choice":
      return (
        <>
          <Headline
            value={answer.choice}
            detail={`Confidence ${answer.confidence.toFixed(2)}`}
          />
          <Distribution
            items={Object.entries(answer.probabilities)}
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
      return (
        <>
          <Headline
            value={answer.score.toFixed(1)}
            unit={`of ${String(levels.length - 1)}`}
            detail={`Confidence ${answer.confidence.toFixed(2)}`}
          />
          <Distribution
            items={levels.map((level) => [
              answer.legend[level] ?? level,
              answer.probabilities[level] ?? 0,
            ])}
            emphasized={nearestLevel(answer)}
          />
        </>
      );
    }
    default:
      // The API may add answer types, which are to be treated as unknown.
      return <p className="text-sm text-muted">Unrecognized answer type.</p>;
  }
}

function Headline({
  value,
  unit,
  detail,
}: {
  value: string;
  unit?: string;
  detail: string;
}) {
  return (
    <div>
      <p className="text-2xl font-semibold tracking-tight">
        {value}
        {unit && (
          <span className="ml-1.5 text-sm font-normal text-muted">{unit}</span>
        )}
      </p>
      <p className="text-xs text-muted tabular-nums">{detail}</p>
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
    <ul className="space-y-1.5">
      {items.map(([label, share]) => {
        const isEmphasized = label === emphasized;
        return (
          <li
            key={label}
            className="grid grid-cols-[minmax(0,5.5rem)_1fr_2.5rem] items-center gap-2 text-xs"
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
      className="block h-1.5 overflow-hidden rounded-full bg-border"
    >
      <span
        className={`block h-full rounded-full ${emphasized ? "bg-foreground" : "bg-muted/50"}`}
        style={{ width: percent(share) }}
      />
    </span>
  );
}
