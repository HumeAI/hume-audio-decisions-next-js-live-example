/**
 * The message in a failed response's body. The Audio Decisions API and this
 * app's route both answer a failure as `{ message }`.
 */
export function errorBodyMessage(body: unknown): string | undefined {
  return typeof body === "object" &&
    body !== null &&
    "message" in body &&
    typeof body.message === "string"
    ? body.message
    : undefined;
}
