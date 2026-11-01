import type { Decisions } from "@humeai/audio-decisions";

/** A share of raters as a whole percentage. */
export function percent(share: number): string {
  return `${String(Math.round(share * 100))}%`;
}

/**
 * The text of the level the most raters would choose. The mean `score` is not
 * used, since raters split between both ends of a scale give the same mean as
 * raters who agree on the middle level.
 */
export function topLevel(answer: Decisions.ScoreAnswer): string {
  const [index] = Object.entries(answer.probabilities).reduce((top, entry) =>
    entry[1] > top[1] ? entry : top,
  );
  return answer.legend[index] ?? index;
}

/** A label for an answer that is short enough for a timeline cell. */
export function summarizeAnswer(answer: Decisions.Answer): string {
  switch (answer.type) {
    case "noul":
      return `${percent(answer.noul)} yes`;
    case "choice":
      return answer.choice;
    case "score":
      return topLevel(answer);
    default:
      // The API may add answer types, which are to be treated as unknown.
      return "Unknown";
  }
}
