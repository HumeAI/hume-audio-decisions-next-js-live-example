import type { Decisions } from "@humeai/decisions";

import { formatTime } from "./format-time";

function isDecisionsResponse(
  value: unknown,
): value is Decisions.DecisionsResponse {
  return (
    typeof value === "object" &&
    value !== null &&
    "answers" in value &&
    typeof value.answers === "object" &&
    value.answers !== null
  );
}

function percent(probability: number): string {
  return `${String(Math.round(probability * 100))}%`;
}

function Bar({ label, probability }: { label: string; probability: number }) {
  return (
    <div className="grid grid-cols-[8rem_1fr_3rem] items-center gap-2">
      <span className="truncate">{label}</span>
      <div className="h-2 rounded bg-gray-100">
        <div
          className="h-2 rounded bg-gray-500"
          style={{ width: percent(probability) }}
        />
      </div>
      <span className="text-right tabular-nums">{percent(probability)}</span>
    </div>
  );
}

function AnswerBody({
  answer,
  chunkStartMs,
}: {
  answer: Decisions.Answer;
  chunkStartMs: number;
}) {
  switch (answer.type) {
    case "noul":
      return <Bar label="yes" probability={answer.noul} />;
    case "choice":
      return (
        <>
          <p>
            {answer.choice} (confidence {answer.confidence.toFixed(2)})
          </p>
          {Object.entries(answer.probabilities).map(([name, probability]) => (
            <Bar key={name} label={name} probability={probability} />
          ))}
        </>
      );
    case "score": {
      const nearest = answer.legend[String(Math.round(answer.score))];
      return (
        <>
          <p>
            {answer.score.toFixed(2)} of {Object.keys(answer.legend).length - 1}
            , nearest {nearest} (confidence {answer.confidence.toFixed(2)})
          </p>
          {Object.entries(answer.probabilities).map(([level, probability]) => (
            <Bar
              key={level}
              label={answer.legend[level] ?? level}
              probability={probability}
            />
          ))}
        </>
      );
    }
    case "moment":
      return answer.moments.length === 0 ? (
        <p>Not found.</p>
      ) : (
        <ul>
          {answer.moments.map((moment) => (
            <li key={moment.audioStartMs} className="tabular-nums">
              {formatTime(chunkStartMs + moment.audioStartMs)} to{" "}
              {formatTime(chunkStartMs + moment.audioEndMs)} (
              {percent(moment.probability)})
            </li>
          ))}
        </ul>
      );
    default:
      // The API may add answer types, which are to be treated as unknown.
      return <p>Unrecognized answer type.</p>;
  }
}

/**
 * A readable summary of each answer in a decisions response. Moment times are
 * shown relative to the whole recording rather than to the chunk.
 */
export function AnswerView({
  response,
  chunkStartMs,
}: {
  response: unknown;
  chunkStartMs: number;
}) {
  if (!isDecisionsResponse(response)) {
    return <p className="text-sm">Unrecognized response.</p>;
  }
  return (
    <dl className="space-y-3 text-sm">
      {Object.entries(response.answers).map(([id, answer]) => (
        <div key={id}>
          <dt className="font-medium">
            {id}{" "}
            <span className="font-normal text-gray-500">{answer.type}</span>
          </dt>
          <dd className="mt-1 space-y-1">
            <AnswerBody answer={answer} chunkStartMs={chunkStartMs} />
          </dd>
        </div>
      ))}
    </dl>
  );
}
