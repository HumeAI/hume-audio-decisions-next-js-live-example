import { describe, expect, it } from "vitest";

import {
  buildQuestion,
  buildRequest,
  DEFAULT_QUESTIONS,
  questionErrors,
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

describe("questionErrors", () => {
  it("rejects fields of only spaces", () => {
    const errors = questionErrors(
      { id: "  ", type: "choice", instructions: " ", options: ["Yes", "  "] },
      [],
    );

    expect(errors).toEqual({
      id: "Enter an ID.",
      instructions: "Enter a question.",
      options: "Fill in every option.",
    });
  });

  it("compares the ID and levels without their surrounding spaces", () => {
    const errors = questionErrors(
      {
        id: " energy ",
        type: "score",
        instructions: "How energetic?",
        options: ["Low", "Low "],
      },
      ["energy"],
    );

    expect(errors).toEqual({
      id: "Another question already uses this ID.",
      options: "Each level must be different.",
    });
  });

  it("ignores the option fields left over when a question becomes noul", () => {
    const errors = questionErrors(
      {
        id: "speaking",
        type: "noul",
        instructions: "Speaking?",
        options: [""],
      },
      [],
    );

    expect(errors).toEqual({});
  });
});
