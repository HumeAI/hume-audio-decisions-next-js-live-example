import type { Decisions } from "@humeai/audio-decisions";

// Span questions answer with time ranges rather than a single value, so
// they have no place on a timeline of 5-second answers.
export type LiveQuestion = Exclude<
  Decisions.Question,
  Decisions.Question.Span
>;

export type QuestionType = LiveQuestion["type"];

export interface NamedQuestion {
  /** Keys the question in the request and its answer in the response. */
  id: string;
  question: LiveQuestion;
}

export const QUESTION_TYPES: readonly QuestionType[] = [
  "noul",
  "choice",
  "score",
];

// The API rejects a choice or score question with fewer options.
export const MIN_OPTIONS = 2;

// The API's limits on a request, which has no span questions here.
export const MAX_QUESTIONS = 20;
export const MAX_ID_CHARS = 256;
export const MAX_INSTRUCTIONS_CHARS = 500;
export const MAX_CONTEXT_CHARS = 1000;
export const MAX_OPTIONS = { choice: 20, score: 10 } as const;
export const MAX_OPTION_CHARS = { choice: 50, score: 150 } as const;

/**
 * Counts characters the way the API does, by Unicode code point. A string's
 * `length` counts UTF-16 code units, so it counts an emoji as two.
 */
export function charCount(text: string): number {
  return Array.from(text).length;
}

export const DEFAULT_CONTEXT = "Live microphone audio of one person speaking.";

export const DEFAULT_QUESTIONS: NamedQuestion[] = [
  {
    id: "speaking",
    question: { type: "noul", instructions: "Is someone speaking?" },
  },
  {
    id: "emotion",
    question: {
      type: "choice",
      instructions: "Which emotion does the speaker convey?",
      criteria: [
        { name: "Happy" },
        { name: "Sad" },
        { name: "Angry" },
        { name: "Neutral" },
      ],
    },
  },
  {
    id: "energy",
    question: {
      type: "score",
      instructions: "How energetic does the speaker sound?",
      criteria: ["Very low", "Low", "Moderate", "High", "Very high"],
    },
  },
];

/** The options of a choice question or the levels of a score question. */
export function questionOptions(question: LiveQuestion): string[] {
  switch (question.type) {
    case "noul":
      return [];
    case "choice":
      return question.criteria.map((criterion) => criterion.name);
    case "score":
      return question.criteria;
  }
}

export function buildQuestion(
  type: QuestionType,
  instructions: string,
  options: string[],
): LiveQuestion {
  switch (type) {
    case "noul":
      return { type, instructions };
    case "choice":
      return {
        type,
        instructions,
        criteria: options.map((name) => ({ name })),
      };
    case "score":
      return { type, instructions, criteria: options };
  }
}

export function optionNoun(type: QuestionType): string {
  return type === "score" ? "level" : "option";
}

/** What stops a question from being saved, keyed by the field to fix. */
export interface QuestionErrors {
  id?: string;
  instructions?: string;
  options?: string;
}

/**
 * Checks the question dialog's fields before they are saved. Text is checked
 * trimmed, since the browser's `required` check accepts a field of only
 * spaces.
 */
export function questionErrors(
  fields: {
    id: string;
    type: QuestionType;
    instructions: string;
    options: string[];
  },
  takenIds: string[],
): QuestionErrors {
  const errors: QuestionErrors = {};
  const id = fields.id.trim();
  if (id === "") {
    errors.id = "Enter an ID.";
  } else if (charCount(id) > MAX_ID_CHARS) {
    errors.id = `Use at most ${String(MAX_ID_CHARS)} characters.`;
  } else if (takenIds.includes(id)) {
    errors.id = "Another question already uses this ID.";
  }
  const instructions = fields.instructions.trim();
  if (instructions === "") {
    errors.instructions = "Enter a question.";
  } else if (charCount(instructions) > MAX_INSTRUCTIONS_CHARS) {
    errors.instructions = `Use at most ${String(MAX_INSTRUCTIONS_CHARS)} characters.`;
  }
  if (fields.type !== "noul") {
    const options = fields.options.map((option) => option.trim());
    const noun = optionNoun(fields.type);
    const maxOptions = MAX_OPTIONS[fields.type];
    const maxChars = MAX_OPTION_CHARS[fields.type];
    if (options.length > maxOptions) {
      errors.options = `Use at most ${String(maxOptions)} ${noun}s.`;
    } else if (options.includes("")) {
      errors.options = `Fill in every ${noun}.`;
    } else if (options.some((option) => charCount(option) > maxChars)) {
      errors.options = `Use at most ${String(maxChars)} characters in each ${noun}.`;
    } else if (new Set(options).size < options.length) {
      errors.options = `Each ${noun} must be different.`;
    }
  }
  return errors;
}

/** What stops the context from being sent, if anything. */
export function contextError(context: string): string | undefined {
  return charCount(context.trim()) > MAX_CONTEXT_CHARS
    ? `Use at most ${MAX_CONTEXT_CHARS.toLocaleString("en-US")} characters.`
    : undefined;
}

/** The `request` part sent with every chunk of a recording. */
export function buildRequest(
  questions: NamedQuestion[],
  context: string,
): Decisions.DecisionsRequest {
  return {
    context: context.trim() || undefined,
    questions: Object.fromEntries(
      questions.map(({ id, question }) => [id, question]),
    ),
  };
}
