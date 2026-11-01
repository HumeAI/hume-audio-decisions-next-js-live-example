import { describe, expect, it } from "vitest";

import {
  buildQuestion,
  buildRequest,
  DEFAULT_QUESTIONS,
  questionOptions,
} from "./questions";

describe("buildRequest", () => {
  it("keys each question by its name", () => {
    const request = buildRequest(DEFAULT_QUESTIONS, "A podcast.");

    expect(Object.keys(request.questions)).toEqual([
      "speaking",
      "emotion",
      "energy",
    ]);
    expect(request.context).toBe("A podcast.");
  });

  it("leaves out blank context", () => {
    expect(buildRequest(DEFAULT_QUESTIONS, "  ").context).toBeUndefined();
  });
});

describe("buildQuestion", () => {
  it.each(["choice", "score"] as const)(
    "keeps the options of a %s question in order",
    (type) => {
      const question = buildQuestion(type, "How energetic?", ["Low", "High"]);

      expect(questionOptions(question)).toEqual(["Low", "High"]);
    },
  );
});
