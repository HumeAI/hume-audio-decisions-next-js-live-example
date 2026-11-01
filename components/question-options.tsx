import { type LiveQuestion, questionOptions } from "@/lib/questions";

/**
 * The answers a question allows: choice options as chips, a noul question as
 * a yes and no pair, and score levels as chips numbered the way scores count
 * them. Chips wrap, so long options and many levels stay readable in a narrow
 * panel.
 */
export function QuestionOptions({ question }: { question: LiveQuestion }) {
  switch (question.type) {
    case "choice":
      return <Chips label="Options" items={questionOptions(question)} />;
    case "noul":
      return (
        <ol
          aria-label="Answers"
          className="flex divide-x overflow-hidden rounded-full border"
        >
          {["Yes", "No"].map((item) => (
            <li
              key={item}
              className="flex-1 px-1.5 py-0.5 text-center text-sm text-muted"
            >
              {item}
            </li>
          ))}
        </ol>
      );
    case "score":
      return (
        <Chips
          label="Levels, lowest to highest"
          items={questionOptions(question)}
          numbered
        />
      );
  }
}

function Chips({
  label,
  items,
  numbered = false,
}: {
  label: string;
  items: string[];
  numbered?: boolean;
}) {
  const List = numbered ? "ol" : "ul";
  return (
    <List aria-label={label} className="flex flex-wrap gap-1.5">
      {items.map((item, index) => (
        <li
          key={item}
          className="rounded-full border px-2.5 py-0.5 text-sm text-muted"
        >
          {numbered && (
            <span aria-hidden className="mr-1.5 text-xs tabular-nums">
              {index}
            </span>
          )}
          {item}
        </li>
      ))}
    </List>
  );
}
