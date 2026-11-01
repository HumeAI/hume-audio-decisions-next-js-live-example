import { PencilIcon, PlusIcon, XIcon } from "@primer/octicons-react";
import { useId, useState } from "react";

import type { NamedQuestion } from "@/lib/questions";

import { Button } from "./button";
import { QuestionDialog } from "./question-dialog";
import { QuestionLabel } from "./question-label";
import { QuestionOptions } from "./question-options";

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
      <div className="flex items-center justify-between">
        {/* On narrow screens, the button that opens the panel names it. */}
        <h2 id={headingId} className="text-base font-semibold max-md:sr-only">
          Questions
        </h2>
        <Button
          variant="text"
          disabled={disabled}
          onClick={() => {
            setEditing("new");
          }}
        >
          <PlusIcon />
          Add question
        </Button>
      </div>

      <ol className="mt-3 divide-y divide-border rounded-xl border border-border">
        {questions.map(({ id, question }, index) => (
          <li key={id} className="space-y-3 px-4 pt-5 pb-4">
            <div className="space-y-1">
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="truncate text-base font-medium">
                  <QuestionLabel id={id} number={index + 1} />
                </h3>
                <p className="shrink-0 text-xs text-muted">{question.type}</p>
              </div>
              <p className="text-sm">{question.instructions}</p>
            </div>
            <QuestionOptions question={question} />
            <div className="flex items-center justify-between">
              <Button
                variant="text"
                disabled={disabled}
                onClick={() => {
                  setEditing(index);
                }}
                aria-label={`Edit ${id}`}
              >
                <PencilIcon size={12} />
                <span className="text-xs">Edit</span>
              </Button>
              {/* The negative margins keep the row as short as the Edit
                  button and line the icon up with the card's right edge. */}
              <div className="-my-1.5 -mr-2.5">
                <Button
                  variant="icon"
                  disabled={disabled || questions.length === 1}
                  onClick={() => {
                    onQuestionsChange(
                      questions.filter((_, other) => other !== index),
                    );
                  }}
                  aria-label={`Remove ${id}`}
                  title="Remove"
                >
                  <XIcon />
                </Button>
              </div>
            </div>
          </li>
        ))}
      </ol>

      {disabled && (
        <p className="mt-3 text-sm text-muted">Locked while recording.</p>
      )}

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
