const MAX_SLUG_LENGTH = 80;

/**
 * A web address part made from a title: lowercase letters, digits and single hyphens. A title
 * with no Latin letters or digits (for example one in Urdu) gives the fallback.
 */
export function toSlug(text: string, fallback: string): string {
  const slug = text
    .normalize("NFKD")
    .replaceAll(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, "-")
    .slice(0, MAX_SLUG_LENGTH)
    .replaceAll(/^-+|-+$/g, "");
  return slug || fallback;
}
