import { describe, expect, it } from "vitest";

import {
  buildRequest,
  contextError,
  type LiveQuestion,
  questionErrors,
} from "./questions";

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

  it("accepts each field at the API's limit, counting an emoji as one character", () => {
    const errors = questionErrors(
      {
        id: "😀".repeat(256),
        type: "choice",
        instructions: "😀".repeat(500),
        options: Array.from(
          { length: 20 },
          (_, index) => `${String(index).padStart(2, "0")}${"😀".repeat(48)}`,
        ),
      },
      [],
    );

    expect(errors).toEqual({});
  });

  it("rejects each field past the API's limit", () => {
    const errors = questionErrors(
      {
        id: "q".repeat(257),
        type: "score",
        instructions: "q".repeat(501),
        options: ["Low", "q".repeat(151)],
      },
      [],
    );

    expect(errors).toEqual({
      id: "Use at most 256 characters.",
      instructions: "Use at most 500 characters.",
      options: "Use at most 150 characters in each level.",
    });
  });

  it("limits choice options and score levels separately", () => {
    const eleven = Array.from({ length: 11 }, (_, index) => String(index));
    const fields = { id: "q", instructions: "Which?", options: eleven };

    expect(questionErrors({ ...fields, type: "choice" }, [])).toEqual({});
    expect(questionErrors({ ...fields, type: "score" }, [])).toEqual({
      options: "Use at most 10 levels.",
    });
  });
});

describe("contextError", () => {
  it("accepts up to 1,000 characters once trimmed", () => {
    expect(contextError(` ${"😀".repeat(1000)} `)).toBeUndefined();
  });

  it("rejects more than 1,000 characters", () => {
    expect(contextError("c".repeat(1001))).toBe(
      "Use at most 1,000 characters.",
    );
  });
});
