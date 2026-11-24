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

async function apiSend<T>(
  method: "POST" | "PATCH" | "DELETE",
  path: string,
  body?: unknown,
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`/api/v1${path}`, {
      method,
      ...(body === undefined
        ? {}
        : { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }),
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

/** Sends JSON to `/api/v1` and returns the `data` of the answer, or throws an `ApiError`. */
export function apiPost<T>(path: string, body: unknown): Promise<T> {
  return apiSend("POST", path, body);
}

/** Like `apiPost`, for a partial update. */
export function apiPatch<T>(path: string, body: unknown): Promise<T> {
  return apiSend("PATCH", path, body);
}

/** Deletes the record at `path`. Throws an `ApiError` when the server refuses. */
export async function apiDelete(path: string): Promise<void> {
  await apiSend("DELETE", path);
}
