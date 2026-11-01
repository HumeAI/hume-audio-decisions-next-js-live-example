import type { Decisions } from "@humeai/audio-decisions";

/** A share of raters as a whole percentage. */
export function percent(share: number): string {
  return `${String(Math.round(share * 100))}%`;
}

export interface ScoreLevel {
  label: string;
  share: number;
}

/**
 * The levels of a score answer, lowest first, and the level the most raters
 * would choose. The mean `score` is not used to pick it, since raters split
 * between both ends of a scale give the same mean as raters who agree on the
 * middle level.
 */
export function scoreLevels(answer: Decisions.ScoreAnswer): {
  levels: ScoreLevel[];
  top: ScoreLevel;
} {
  // Integer keys are always listed in ascending order, whatever their order in
  // the JSON, so the levels come out lowest first.
  const levels = Object.entries(answer.legend).map(([index, label]) => ({
    label,
    share: answer.probabilities[index] ?? 0,
  }));
  const top = levels.reduce((best, level) =>
    level.share > best.share ? level : best,
  );
  return { levels, top };
}

/** A label for an answer that is short enough for a timeline cell. */
export function summarizeAnswer(answer: Decisions.Answer): string {
  switch (answer.type) {
    case "noul":
      return `${percent(answer.noul)} yes`;
    case "choice":
      return answer.choice;
    case "score":
      return scoreLevels(answer).top.label;
    default:
      // The API may add answer types, which are to be treated as unknown.
      return "Unknown";
  }
}
