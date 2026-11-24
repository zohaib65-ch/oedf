import "server-only";

/** Makes typed search text safe to use inside a regular expression. */
export const escapeRegExp = (value: string): string =>
  value.replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);
