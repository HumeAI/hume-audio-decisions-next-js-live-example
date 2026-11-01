import type { Decisions } from "@humeai/audio-decisions";
import { useId } from "react";

import { nearestLevel, summarizeAnswer } from "@/lib/answers";
import type { NamedQuestion } from "@/lib/questions";

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
      className="row-span-3 grid grid-rows-subgrid gap-5 rounded-xl border border-border p-5"
    >
      <header className="space-y-1.5">
        <div className="flex items-baseline justify-between gap-3">
          <h3 id={titleId} className="truncate font-medium">
            {question.id}
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
        <AnswerDetail answer={answer} />
      ) : (
        <p className="text-sm text-muted">No answer was returned.</p>
      )}
    </article>
  );
}

function AnswerDetail({ answer }: { answer: Decisions.Answer }) {
  switch (answer.type) {
    case "noul": {
      const value = summarizeAnswer(answer);
      const share = value === "Yes" ? answer.noul : 1 - answer.noul;
      return (
        <>
          <Headline
            value={value}
            detail={`${percent(share)} of raters would answer ${value.toLowerCase()}`}
          />
          <Distribution
            items={[
              ["Yes", answer.noul],
              ["No", 1 - answer.noul],
            ]}
            emphasized={value}
          />
        </>
      );
    }
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
            value={nearestLevel(answer) ?? answer.score.toFixed(1)}
            unit={`${answer.score.toFixed(1)} of ${String(levels.length - 1)}`}
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
      <p className="text-3xl font-semibold tracking-tight">
        {value}
        {unit && (
          <span className="ml-2 text-base font-normal tracking-normal text-muted">
            {unit}
          </span>
        )}
      </p>
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
