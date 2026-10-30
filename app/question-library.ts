import type { Decisions } from "@humeai/decisions";

export interface LibraryQuestion {
  id: string;
  label: string;
  question: Decisions.Question;
}

export const QUESTION_LIBRARY: LibraryQuestion[] = [
  {
    id: "emotion",
    label: "Emotion",
    question: {
      type: "choice",
      instructions: "Which emotion does the speaker convey?",
      criteria: [
        { name: "happiness", description: "Happiness or amusement" },
        { name: "sadness", description: "Sadness or grief" },
        { name: "anger", description: "Anger, whether shouted or held back" },
        { name: "fear", description: "Fear or anxiety" },
        { name: "neutral", description: "No clear emotion" },
      ],
    },
  },
  {
    id: "speaking",
    label: "Someone speaking",
    question: { type: "noul", instructions: "Is someone speaking?" },
  },
  {
    id: "whispered",
    label: "Whispering",
    question: { type: "noul", instructions: "Is the voice whispering?" },
  },
  {
    id: "multiple_speakers",
    label: "Several speakers",
    question: {
      type: "noul",
      instructions: "Is more than one person speaking?",
    },
  },
  {
    id: "background_noise",
    label: "Background noise",
    question: {
      type: "noul",
      instructions: "Is there noticeable background noise?",
    },
  },
  {
    id: "energy",
    label: "Energy",
    question: {
      type: "score",
      instructions: "How energetic does the speaker sound?",
      criteria: ["Very low", "Low", "Moderate", "High", "Very high"],
    },
  },
  {
    id: "sounds_confident",
    label: "Sounds confident",
    question: {
      type: "score",
      instructions: "How confident does the speaker sound?",
      criteria: ["Not at all", "Slightly", "Moderately", "Very", "Extremely"],
    },
  },
  {
    id: "vocal_bursts",
    label: "Vocal bursts",
    question: {
      type: "moment",
      instructions:
        "Where does the speaker laugh, sigh, gasp or make another vocal burst?",
    },
  },
];
