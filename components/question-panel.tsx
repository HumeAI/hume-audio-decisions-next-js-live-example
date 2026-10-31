import { useId, useState } from "react";

import {
  MAX_QUESTIONS,
  type NamedQuestion,
  questionOptions,
} from "@/lib/questions";

import { Button } from "./button";
import { QuestionDialog } from "./question-dialog";

interface QuestionPanelProps {
  questions: NamedQuestion[];
  onQuestionsChange: (questions: NamedQuestion[]) => void;
  context: string;
  onContextChange: (context: string) => void;
  /** Set while recording, since every chunk is sent with the same questions. */
  disabled: boolean;
}

export function QuestionPanel({
  questions,
  onQuestionsChange,
  context,
  onContextChange,
  disabled,
}: QuestionPanelProps) {
  const [editing, setEditing] = useState<number | "new" | null>(null);
  const ids = useId();

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
    <div className="space-y-6">
      <section aria-labelledby={`${ids}-questions`}>
        <div className="flex items-baseline justify-between">
          <h2 id={`${ids}-questions`} className="text-sm font-semibold">
            Questions
          </h2>
          <p className="text-sm text-muted">
            {questions.length} of {MAX_QUESTIONS}
          </p>
        </div>

        <ul className="mt-3 divide-y divide-border rounded-xl border border-border">
          {questions.map(({ id, question }, index) => {
            const options = questionOptions(question);
            return (
              <li key={id} className="space-y-1 p-3">
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="truncate text-sm font-medium">{id}</h3>
                  <p className="shrink-0 text-xs text-muted">{question.type}</p>
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
            disabled={disabled || questions.length >= MAX_QUESTIONS}
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
      </section>

      <div className="space-y-1.5">
        <div className="flex items-baseline justify-between">
          <label htmlFor={`${ids}-context`} className="text-sm font-semibold">
            Context
          </label>
          <p className="text-sm text-muted">Optional</p>
        </div>
        <textarea
          id={`${ids}-context`}
          rows={3}
          value={context}
          disabled={disabled}
          onChange={(event) => {
            onContextChange(event.target.value);
          }}
          aria-describedby={`${ids}-context-hint`}
          className="w-full resize-none rounded-lg border border-border bg-transparent px-3 py-2 text-sm disabled:opacity-60"
        />
        <p id={`${ids}-context-hint`} className="text-sm text-muted">
          Describes the setting. The model reads it with the audio, so it can
          change the answers.
        </p>
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
    </div>
  );
}
