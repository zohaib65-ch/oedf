import "server-only";

import { toSlug } from "@/lib/slug";
import { findTakenSlugs, type SlugOwner } from "@/server/repositories/slug.repository";

/**
 * A web address made from a title, numbered when another record already has it. It is chosen
 * once, when the record is created, and never changes, so shared links keep working.
 */
export async function uniqueSlug(owner: SlugOwner, title: string): Promise<string> {
  const base = toSlug(title, owner);
  const taken = await findTakenSlugs(owner, base);
  if (!taken.has(base)) {
    return base;
  }
  let number = 2;
  while (taken.has(`${base}-${String(number)}`)) {
    number += 1;
  }
  return `${base}-${String(number)}`;
}
