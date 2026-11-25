/** Said when a field is invalid but no rule gave a message, so a red field is never left unexplained. */
const FALLBACK_MESSAGE = "Check this answer.";

/** The first message in a react-hook-form error, looking inside nested parts (`ref` is the input element). */
function findMessage(error: unknown): string | undefined {
  if (!error || typeof error !== "object") {
    return undefined;
  }
  if ("message" in error && typeof error.message === "string" && error.message !== "") {
    return error.message;
  }
  for (const [key, value] of Object.entries(error)) {
    const message = key === "ref" ? undefined : findMessage(value);
    if (message) {
      return message;
    }
  }
  return undefined;
}

/**
 * What to show under an invalid field. A rule on one part of the value (such as the first topic,
 * `tags.0`) puts its message below the field's own error, so it is looked for there too.
 */
export function fieldErrorMessage(error: unknown): string {
  return findMessage(error) ?? FALLBACK_MESSAGE;
}
