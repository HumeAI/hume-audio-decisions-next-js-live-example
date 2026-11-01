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
