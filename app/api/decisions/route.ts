import {
  type Decisions,
  DecisionsClient,
  DecisionsError,
  DecisionsTimeoutError,
} from "@humeai/decisions";

function errorResponse(status: number, message: string, body?: unknown) {
  return Response.json({ message, body }, { status });
}

export async function POST(request: Request): Promise<Response> {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return errorResponse(400, "Expected a multipart/form-data body.");
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return errorResponse(400, "Missing the `file` part.");
  }

  const requestPart = formData.get("request");
  if (typeof requestPart !== "string") {
    return errorResponse(400, "Missing the `request` part.");
  }

  let decisionsRequest: unknown;
  try {
    decisionsRequest = JSON.parse(requestPart);
  } catch {
    return errorResponse(400, "The `request` part is not valid JSON.");
  }
  if (typeof decisionsRequest !== "object" || decisionsRequest === null) {
    return errorResponse(400, "The `request` part must be a JSON object.");
  }

  try {
    const response = await new DecisionsClient().decisions.create({
      file,
      request: decisionsRequest as Decisions.DecisionsRequest,
    });
    return Response.json(response);
  } catch (error) {
    if (error instanceof DecisionsTimeoutError) {
      return errorResponse(504, error.message);
    }
    if (error instanceof DecisionsError) {
      return errorResponse(error.statusCode ?? 502, error.message, error.body);
    }
    // The SDK validates the request shape before sending and throws a
    // non-DecisionsError when it does not match, so this is a client error.
    if (error instanceof Error) {
      return errorResponse(400, error.message);
    }
    throw error;
  }
}
