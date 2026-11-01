import type { Decisions } from "@humeai/audio-decisions";

/** The name of the level a score is nearest to. */
export function nearestLevel(
  answer: Decisions.ScoreAnswer,
): string | undefined {
  return answer.legend[String(Math.round(answer.score))];
}

/** A label for an answer that is short enough for a timeline cell. */
export function summarizeAnswer(answer: Decisions.Answer): string {
  switch (answer.type) {
    case "noul":
      // `noul` estimates the share of raters who would answer yes.
      return answer.noul >= 0.5 ? "Yes" : "No";
    case "choice":
      return answer.choice;
    case "score": {
      const level = nearestLevel(answer);
      const score = answer.score.toFixed(1);
      return level ? `${level} ${score}` : score;
    }
    default:
      // The API may add answer types, which are to be treated as unknown.
      return "Unknown";
  }
}
