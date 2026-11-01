import { type LiveQuestion, questionOptions } from "@/lib/questions";

/**
 * The answers a question allows, drawn in the shape of its answer: choice
 * options as separate chips, a noul question as a yes and no pair, and score
 * levels as one scale numbered the way scores count them.
 */
export function QuestionOptions({ question }: { question: LiveQuestion }) {
  switch (question.type) {
    case "choice":
      return (
        <ul aria-label="Options" className="flex flex-wrap gap-1.5">
          {questionOptions(question).map((option) => (
            <li
              key={option}
              className="rounded-full border border-border px-2 py-0.5 text-xs text-muted"
            >
              {option}
            </li>
          ))}
        </ul>
      );
    case "noul":
      return <Segments label="Answers" items={["Yes", "No"]} />;
    case "score":
      return (
        <Segments
          label="Levels, lowest to highest"
          items={questionOptions(question)}
          numbered
        />
      );
  }
}

function Segments({
  label,
  items,
  numbered = false,
}: {
  label: string;
  items: string[];
  numbered?: boolean;
}) {
  return (
    <div className="space-y-1">
      <ol
        aria-label={label}
        className="flex divide-x divide-border overflow-hidden rounded-md border border-border"
      >
        {items.map((item) => (
          <li
            key={item}
            title={item}
            className="min-w-0 flex-1 truncate px-1.5 py-1 text-center text-xs text-muted"
          >
            {item}
          </li>
        ))}
      </ol>
      {numbered && (
        <div
          aria-hidden
          className="flex text-center text-xs text-muted tabular-nums"
        >
          {items.map((item, index) => (
            <span key={item} className="flex-1">
              {index}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
