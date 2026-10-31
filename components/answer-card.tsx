import type { Decisions } from "@humeai/decisions";
import { useId } from "react";

import { summarizeAnswer } from "@/lib/answers";
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

  return (
    <article
      aria-labelledby={titleId}
      className="flex flex-col gap-4 rounded-xl border border-border p-4"
    >
      <header className="space-y-1">
        <div className="flex items-baseline justify-between gap-3">
          <h3 id={titleId} className="truncate text-sm font-medium">
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
    case "noul":
      return (
        <div className="space-y-2">
          <Headline
            value={summarizeAnswer(answer)}
            detail={`${percent(answer.noul)} of raters would answer yes`}
          />
          <Bar share={answer.noul} emphasized />
        </div>
      );
    case "choice":
      return (
        <div className="space-y-3">
          <Headline
            value={answer.choice}
            detail={`Confidence ${answer.confidence.toFixed(2)}`}
          />
          <Distribution
            items={Object.entries(answer.probabilities)}
            emphasized={answer.choice}
          />
        </div>
      );
    case "score": {
      // Levels are keyed by index, so they are ordered by number rather than
      // by the key order of the JSON object.
      const levels = Object.keys(answer.legend).sort(
        (a, b) => Number(a) - Number(b),
      );
      const nearestLevel = String(Math.round(answer.score));
      return (
        <div className="space-y-3">
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
            emphasized={answer.legend[nearestLevel]}
          />
        </div>
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
