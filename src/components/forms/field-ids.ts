/** The id of a field's input, from its form path. Stable, so the error summary can link to it. */
export function fieldId(name: string): string {
  return `field-${name.replaceAll(".", "-")}`;
}

/** The ids a field's description and error get, for `aria-describedby`. */
export function describedBy(
  name: string,
  { hasDescription, hasError }: { hasDescription: boolean; hasError: boolean },
) {
  const ids = [
    hasDescription ? `${fieldId(name)}-description` : "",
    hasError ? `${fieldId(name)}-error` : "",
  ].filter(Boolean);
  return ids.length > 0 ? ids.join(" ") : undefined;
}
