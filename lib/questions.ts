import type { Decisions } from "@humeai/audio-decisions";

// Moment questions answer with time ranges rather than a single value, so
// they have no place on a timeline of 5-second answers.
export type LiveQuestion = Exclude<
  Decisions.Question,
  Decisions.Question.Moment
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

export const DEFAULT_CONTEXT = "Live microphone audio of one person speaking.";

export const MAX_CONTEXT_LENGTH = 1_000;

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
      criteria: ["Low", "Moderate", "High"],
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
