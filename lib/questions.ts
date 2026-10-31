import type { Decisions } from "@humeai/decisions";

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

// The API accepts up to 100 questions with up to 100 options each. This
// example keeps to 4 of each so every answer fits on the timeline.
export const MAX_QUESTIONS = 4;
export const MIN_OPTIONS = 2;
export const MAX_OPTIONS = 4;

export const DEFAULT_CONTEXT = "Live microphone audio of one person speaking.";

export const DEFAULT_QUESTIONS: NamedQuestion[] = [
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
    id: "speaking",
    question: { type: "noul", instructions: "Is someone speaking?" },
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
