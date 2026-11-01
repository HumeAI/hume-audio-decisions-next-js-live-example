import { useId, useState } from "react";

import { type NamedQuestion, questionOptions } from "@/lib/questions";

import { Button } from "./button";
import { QuestionDialog } from "./question-dialog";
import { TypePill } from "./type-pill";

interface QuestionPanelProps {
  questions: NamedQuestion[];
  onQuestionsChange: (questions: NamedQuestion[]) => void;
  /** Set while recording, since every chunk is sent with the same questions. */
  disabled: boolean;
}

export function QuestionPanel({
  questions,
  onQuestionsChange,
  disabled,
}: QuestionPanelProps) {
  const [editing, setEditing] = useState<number | "new" | null>(null);
  const headingId = useId();

  function saveQuestion(saved: NamedQuestion) {
    onQuestionsChange(
      editing === "new"
        ? [...questions, saved]
        : questions.map((question, index) =>
            index === editing ? saved : question,
          ),
    );
    setEditing(null);
  }

  return (
    <section aria-labelledby={headingId}>
      {/* On narrow screens, the button that opens the panel names it. */}
      <h2 id={headingId} className="text-sm font-semibold max-md:sr-only">
        Questions
      </h2>

      <ul className="divide-y divide-border rounded-xl border border-border md:mt-3">
        {questions.map(({ id, question }, index) => {
          const options = questionOptions(question);
          return (
            <li key={id} className="space-y-1 p-3">
              <div className="flex items-center justify-between gap-3">
                <h3 className="truncate text-sm font-medium">{id}</h3>
                <TypePill type={question.type} />
              </div>
              <p className="text-sm">{question.instructions}</p>
              {options.length > 0 && (
                <p className="text-sm text-muted">{options.join(", ")}</p>
              )}
              <div className="flex gap-4 pt-1">
                <Button
                  variant="text"
                  disabled={disabled}
                  onClick={() => {
                    setEditing(index);
                  }}
                  aria-label={`Edit ${id}`}
                >
                  Edit
                </Button>
                <Button
                  variant="text"
                  disabled={disabled || questions.length === 1}
                  onClick={() => {
                    onQuestionsChange(
                      questions.filter((_, other) => other !== index),
                    );
                  }}
                  aria-label={`Remove ${id}`}
                >
                  Remove
                </Button>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="mt-3 flex items-center gap-3">
        <Button
          disabled={disabled}
          onClick={() => {
            setEditing("new");
          }}
        >
          Add question
        </Button>
        {disabled && (
          <p className="text-sm text-muted">Locked while recording.</p>
        )}
      </div>

      {editing !== null && (
        <QuestionDialog
          question={editing === "new" ? null : (questions[editing] ?? null)}
          takenIds={questions
            .filter((_, index) => index !== editing)
            .map(({ id }) => id)}
          onSave={saveQuestion}
          onCancel={() => {
            setEditing(null);
          }}
        />
      )}
    </section>
  );
}
