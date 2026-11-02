import type { QuestionType } from "@/lib/questions";

/**
 * A question's id after its number, so a question can be matched across the
 * question list, the timeline and the answers.
 */
export function QuestionLabel({ id, number }: { id: string; number: number }) {
  return (
    <>
      <span className="mr-2 text-muted tabular-nums">{number}.</span>
      {id}
    </>
  );
}

/** The title row of a question in the question list and the answers. */
export function QuestionHeading({
  id,
  number,
  type,
  titleId,
}: {
  id: string;
  number: number;
  type: QuestionType;
  titleId?: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <h3 id={titleId} className="truncate font-medium">
        <QuestionLabel id={id} number={number} />
      </h3>
      <p className="shrink-0 text-xs text-muted">{type}</p>
    </div>
  );
}
