import "server-only";

import type { INSTITUTION_TYPES } from "@/lib/constants/enums";
import type { InstitutionFilters } from "@/lib/validations/list-params";
import { connectDb } from "@/server/db/connection";
import { InstitutionModel } from "@/server/db/models/institution.model";
import { ProgramModel } from "@/server/db/models/program.model";

// The public site shows only Active institutions marked public. Agreements and reviews are internal
// and are never selected.
const PUBLIC_FILTER = { status: "ACTIVE", isPublic: true } as const;

export interface InstitutionSummary {
  id: string;
  slug: string;
  name: string;
  type: (typeof INSTITUTION_TYPES)[number];
  city: string;
}

export interface InstitutionDetail extends InstitutionSummary {
  address: string;
  description: string;
  /** Published programs offered at the institution. */
  programs: { slug: string; title: string }[];
}

const SUMMARY_FIELDS = { slug: 1, name: 1, type: 1, city: 1 } as const;

function toSummary(institution: {
  _id: { toString(): string };
  slug: string;
  name: string;
  type: (typeof INSTITUTION_TYPES)[number];
  city: string;
}): InstitutionSummary {
  return {
    id: institution._id.toString(),
    slug: institution.slug,
    name: institution.name,
    type: institution.type,
    city: institution.city,
  };
}

export async function listPublicInstitutions(
  filters: InstitutionFilters,
  limit?: number,
): Promise<InstitutionSummary[]> {
  await connectDb();
  const query = InstitutionModel.find(
    {
      ...PUBLIC_FILTER,
      ...(filters.city ? { city: filters.city } : {}),
      ...(filters.type ? { type: filters.type } : {}),
    },
    SUMMARY_FIELDS,
  ).sort({ name: 1 });
  const institutions = await (limit ? query.limit(limit) : query).lean();
  return institutions.map(toSummary);
}

/** The cities that have at least one public institution, for the filter. */
export async function listPublicInstitutionCities(): Promise<string[]> {
  await connectDb();
  const cities = await InstitutionModel.distinct("city", PUBLIC_FILTER);
  return cities.map(String).sort((a, b) => a.localeCompare(b));
}

export async function findPublicInstitutionBySlug(slug: string): Promise<InstitutionDetail | null> {
  await connectDb();
  const institution = await InstitutionModel.findOne(
    { slug, ...PUBLIC_FILTER },
    { ...SUMMARY_FIELDS, address: 1, description: 1 },
  ).lean();
  if (!institution) {
    return null;
  }
  const programs = await ProgramModel.find(
    { institutionIds: institution._id, status: "PUBLISHED" },
    { slug: 1, title: 1 },
  )
    .sort({ title: 1 })
    .lean();
  return {
    ...toSummary(institution),
    address: institution.address,
    description: institution.description,
    programs: programs.map(({ slug: programSlug, title }) => ({ slug: programSlug, title })),
  };
}
