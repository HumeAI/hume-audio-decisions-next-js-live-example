import {
  type Decisions,
  DecisionsClient,
  DecisionsError,
  DecisionsTimeoutError,
} from "@humeai/audio-decisions";

import { errorBodyMessage } from "@/lib/error-body";

/** Every failure is answered as `{ message }`, which the page shows as is. */
function failure(status: number, message: string): Response {
  return Response.json({ message }, { status });
}

export async function POST(request: Request): Promise<Response> {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return failure(400, "Expected a multipart/form-data body.");
  }

  const file = form.get("file");
  const requestPart = form.get("request");
  if (!(file instanceof File) || typeof requestPart !== "string") {
    return failure(400, "Expected a `file` part and a `request` part.");
  }

  let decisionsRequest: Decisions.DecisionsRequest;
  try {
    decisionsRequest = JSON.parse(requestPart) as Decisions.DecisionsRequest;
  } catch {
    return failure(400, "The `request` part is not valid JSON.");
  }

  try {
    const response = await new DecisionsClient().decisions.create({
      file,
      request: decisionsRequest,
    });
    return Response.json(response);
  } catch (error) {
    if (error instanceof DecisionsTimeoutError) {
      return failure(504, error.message);
    }
    if (error instanceof DecisionsError) {
      // The API's error bodies carry a message written for a person. The SDK's
      // own message also lists the status code and the whole body.
      return failure(
        error.statusCode ?? 502,
        errorBodyMessage(error.body) ?? error.message,
      );
    }
    // The SDK checks the request against the API's schema before sending it,
    // and throws a plain error when it does not match.
    if (error instanceof Error) {
      return failure(400, error.message);
    }
    throw error;
  }
}
