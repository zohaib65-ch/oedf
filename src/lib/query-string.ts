type QueryValue = string | number | undefined;

/**
 * Builds a link to `path` with the given search params. Empty values and a first page are left
 * out, so every filter combination has one clean, shareable URL.
 */
export function buildHref(path: string, params: Record<string, QueryValue>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === "" || (key === "page" && value === 1)) {
      continue;
    }
    search.set(key, String(value));
  }
  const query = search.toString();
  return query ? `${path}?${query}` : path;
}
