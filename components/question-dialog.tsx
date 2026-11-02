import { type SubmitEvent, useId, useState } from "react";

import {
  buildQuestion,
  MAX_OPTIONS,
  MIN_OPTIONS,
  type NamedQuestion,
  optionNoun,
  type QuestionErrors,
  questionErrors,
  QUESTION_TYPES,
  type QuestionType,
  questionOptions,
} from "@/lib/questions";

import { Button } from "./button";
import { FIELD_CLASS_NAME } from "./field";
import { Modal } from "./modal";

interface OptionField {
  key: string;
  text: string;
}

function optionField(text: string): OptionField {
  return { key: crypto.randomUUID(), text };
}

interface QuestionDialogProps {
  /** The question to edit, or `null` to add a new one. */
  question: NamedQuestion | null;
  /** IDs of the other questions, which this one must not reuse. */
  takenIds: string[];
  onSave: (question: NamedQuestion) => void;
  onCancel: () => void;
}

export function QuestionDialog({
  question,
  takenIds,
  onSave,
  onCancel,
}: QuestionDialogProps) {
  const [id, setId] = useState(question?.id ?? "");
  const [type, setType] = useState<QuestionType>(
    question?.question.type ?? "noul",
  );
  const [instructions, setInstructions] = useState(
    question?.question.instructions ?? "",
  );
  const [options, setOptions] = useState(() => {
    const existing = question ? questionOptions(question.question) : [];
    const texts =
      existing.length > 0 ? existing : Array<string>(MIN_OPTIONS).fill("");
    return texts.map(optionField);
  });
  const [hasTriedSaving, setHasTriedSaving] = useState(false);
  const fieldIds = useId();

  const usesOptions = type !== "noul";
  const maxOptions = type === "noul" ? 0 : MAX_OPTIONS[type];
  const noun = optionNoun(type);
  const optionTexts = options.map((option) => option.text.trim());
  const errors = questionErrors(
    { id, type, instructions, options: optionTexts },
    takenIds,
  );
  // Problems show once saving has been tried, so a new question does not open
  // with every field marked as missing.
  const shownErrors: QuestionErrors = hasTriedSaving ? errors : {};

  function updateOption(key: string, text: string) {
    setOptions((current) =>
      current.map((option) =>
        option.key === key ? { ...option, text } : option,
      ),
    );
  }

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (Object.keys(errors).length > 0) {
      setHasTriedSaving(true);
      return;
    }
    onSave({
      id: id.trim(),
      question: buildQuestion(type, instructions.trim(), optionTexts),
    });
  }

  return (
    <Modal
      title={question ? "Edit question" : "Add question"}
      onDismiss={onCancel}
    >
      <form onSubmit={handleSubmit} className="mt-4 space-y-5">
        <div className="space-y-1.5">
          <label htmlFor={`${fieldIds}-id`} className="text-sm font-medium">
            Question ID
          </label>
          <input
            id={`${fieldIds}-id`}
            required
            value={id}
            onChange={(event) => {
              setId(event.target.value);
            }}
            placeholder="speaking"
            autoComplete="off"
            aria-invalid={shownErrors.id !== undefined}
            aria-describedby={`${fieldIds}-id-hint`}
            className={FIELD_CLASS_NAME}
          />
          <p id={`${fieldIds}-id-hint`} className="text-sm text-muted">
            {shownErrors.id ? (
              <span className="text-danger">{shownErrors.id}</span>
            ) : (
              "Labels the timeline row and keys the answer in the response."
            )}
          </p>
        </div>

        <fieldset>
          <legend className="text-sm font-medium">Type</legend>
          <div className="mt-2 flex gap-5">
            {QUESTION_TYPES.map((questionType) => (
              <label
                key={questionType}
                className="flex items-center gap-2 text-sm"
              >
                <input
                  type="radio"
                  name="type"
                  checked={type === questionType}
                  onChange={() => {
                    setType(questionType);
                  }}
                  className="size-4 accent-foreground"
                />
                {questionType}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="space-y-1.5">
          <label
            htmlFor={`${fieldIds}-instructions`}
            className="text-sm font-medium"
          >
            Question
          </label>
          <textarea
            id={`${fieldIds}-instructions`}
            required
            rows={2}
            value={instructions}
            onChange={(event) => {
              setInstructions(event.target.value);
            }}
            placeholder="Is someone speaking?"
            aria-invalid={shownErrors.instructions !== undefined}
            aria-describedby={
              shownErrors.instructions
                ? `${fieldIds}-instructions-error`
                : undefined
            }
            className={`${FIELD_CLASS_NAME} resize-none`}
          />
          {shownErrors.instructions && (
            <p
              id={`${fieldIds}-instructions-error`}
              className="text-sm text-danger"
            >
              {shownErrors.instructions}
            </p>
          )}
        </div>

        {usesOptions && (
          <fieldset aria-describedby={`${fieldIds}-options-hint`}>
            <legend className="text-sm font-medium">
              {type === "score" ? "Levels, lowest to highest" : "Options"}
            </legend>
            <ol className="mt-2 space-y-2">
              {options.map((option, index) => (
                <li key={option.key} className="flex items-center gap-3">
                  <input
                    required
                    value={option.text}
                    onChange={(event) => {
                      updateOption(option.key, event.target.value);
                    }}
                    aria-label={`${noun} ${String(index + 1)}`}
                    autoComplete="off"
                    className={FIELD_CLASS_NAME}
                  />
                  <Button
                    variant="text"
                    disabled={options.length <= MIN_OPTIONS}
                    onClick={() => {
                      setOptions((current) =>
                        current.filter(({ key }) => key !== option.key),
                      );
                    }}
                    aria-label={`Remove ${noun} ${String(index + 1)}`}
                  >
                    Remove
                  </Button>
                </li>
              ))}
            </ol>
            <p
              id={`${fieldIds}-options-hint`}
              className="mt-1.5 text-sm text-muted"
            >
              {shownErrors.options ? (
                <span className="text-danger">{shownErrors.options}</span>
              ) : (
                `${String(MIN_OPTIONS)} to ${String(maxOptions)} ${noun}s.`
              )}
            </p>
            <div className="mt-3">
              <Button
                disabled={options.length >= maxOptions}
                onClick={() => {
                  setOptions((current) => [...current, optionField("")]);
                }}
              >
                Add {noun}
              </Button>
            </div>
          </fieldset>
        )}

        <div className="flex justify-end gap-3 pt-1">
          <Button onClick={onCancel}>Cancel</Button>
          <Button type="submit" variant="primary">
            {question ? "Save changes" : "Add question"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
