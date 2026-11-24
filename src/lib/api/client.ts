/** A failed API call, with the server's code and the messages for each field. */
export class ApiError extends Error {
  readonly code: string;
  readonly status: number;
  readonly fieldErrors: Record<string, string[]>;

  constructor(
    code: string,
    message: string,
    status: number,
    fieldErrors: Record<string, string[]> = {},
  ) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

interface ErrorBody {
  error?: { code?: string; message?: string; details?: { fieldErrors?: Record<string, string[]> } };
}

/** Sends JSON to `/api/v1` and returns the `data` of the answer, or throws an `ApiError`. */
export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`/api/v1${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new ApiError(
      "NETWORK_ERROR",
      "We could not reach the server. Check your connection and try again.",
      0,
    );
  }

  const json = (await response.json().catch(() => ({}))) as ErrorBody & { data?: T };
  if (!response.ok) {
    throw new ApiError(
      json.error?.code ?? "UNKNOWN_ERROR",
      json.error?.message ?? "Something went wrong. Please try again.",
      response.status,
      json.error?.details?.fieldErrors,
    );
  }
  return json.data as T;
}
