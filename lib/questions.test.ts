import { describe, expect, it } from "vitest";

import { buildRequest, type LiveQuestion, questionErrors } from "./questions";

describe("buildRequest", () => {
  it("keys each question by its ID", () => {
    const laughing: LiveQuestion = {
      type: "noul",
      instructions: "Is someone laughing?",
    };
    const pace: LiveQuestion = {
      type: "score",
      instructions: "How fast is the speech?",
      criteria: ["Slow", "Fast"],
    };

    const request = buildRequest(
      [
        { id: "laughing", question: laughing },
        { id: "pace", question: pace },
      ],
      "A podcast.",
    );

    expect(request).toEqual({
      context: "A podcast.",
      questions: { laughing, pace },
    });
  });
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
