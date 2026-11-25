import "server-only";

import { connectDb } from "@/server/db/connection";
import { InstitutionModel } from "@/server/db/models/institution.model";
import { ProgramModel } from "@/server/db/models/program.model";
import { VacancyModel } from "@/server/db/models/vacancy.model";
import { escapeRegExp } from "@/server/lib/escape-regexp";

const MODELS = { vacancy: VacancyModel, program: ProgramModel, institution: InstitutionModel };

export type SlugOwner = keyof typeof MODELS;

/** The slugs already taken by `base` and its numbered versions (`base-2`, `base-3`, …). */
export async function findTakenSlugs(owner: SlugOwner, base: string): Promise<Set<string>> {
  await connectDb();
  const pattern = new RegExp(String.raw`^${escapeRegExp(base)}(-\d+)?$`);
  // The three models share the `slug` field; a union of their query types cannot be called directly.
  const model = MODELS[owner] as typeof VacancyModel;
  const rows = await model.find({ slug: pattern }, { slug: 1 }).lean();
  return new Set(rows.map((row) => row.slug));
}
