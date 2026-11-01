import type { QuestionType } from "@/lib/questions";

// The colors the API docs use for each question type, in both themes.
const TYPE_CLASS_NAMES: Record<QuestionType, string> = {
  noul: "bg-[#dde2f6]",
  choice: "bg-[#d8f0e6]",
  score: "bg-[#f5e7dd]",
};

export function TypePill({ type }: { type: QuestionType }) {
  return (
    <span
      className={`shrink-0 rounded-full px-2 py-0.5 font-mono text-xs text-[#262626] ${TYPE_CLASS_NAMES[type]}`}
    >
      {type}
    </span>
  );
}
