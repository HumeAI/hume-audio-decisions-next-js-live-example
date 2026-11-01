import { describe, expect, it } from "vitest";

import { summarizeAnswer } from "./answers";

describe("summarizeAnswer", () => {
  it("gives a yes or no answer as the share of raters who would say yes", () => {
    expect(summarizeAnswer({ type: "noul", noul: 0.416 })).toBe("42% yes");
  });

  it("names the level most raters would choose rather than the mean", () => {
    const summary = summarizeAnswer({
      type: "score",
      score: 1.4,
      confidence: 0.5,
      probabilities: { "0": 0.1, "1": 0.4, "2": 0.5 },
      legend: { "0": "Low", "1": "Moderate", "2": "High" },
    });

    expect(summary).toBe("High");
  });
});
