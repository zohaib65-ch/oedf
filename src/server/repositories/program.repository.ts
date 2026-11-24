import "server-only";
import mongoose from "mongoose";

import type { PROGRAM_CATEGORIES } from "@/lib/constants/enums";
import type { ProgramFilters } from "@/lib/validations/list-params";
import { connectDb } from "@/server/db/connection";
import { InstitutionModel } from "@/server/db/models/institution.model";
import { ProgramModel } from "@/server/db/models/program.model";

export interface ProgramSummary {
  id: string;
  slug: string;
  title: string;
  category: (typeof PROGRAM_CATEGORIES)[number];
  summary: string;
  duration: string;
  acceptsApplications: boolean;
}

export interface ProgramDetail extends ProgramSummary {
  description: string;
  eligibility: string;
  /** Active, public institutions that offer the program. */
  institutions: { slug: string; name: string; city: string }[];
}

const SUMMARY_FIELDS = {
  slug: 1,
  title: 1,
  category: 1,
  summary: 1,
  duration: 1,
  acceptsApplications: 1,
} as const;

function toSummary(program: {
  _id: { toString(): string };
  slug: string;
  title: string;
  category: (typeof PROGRAM_CATEGORIES)[number];
  summary: string;
  duration: string;
  acceptsApplications: boolean;
}): ProgramSummary {
  return {
    id: program._id.toString(),
    slug: program.slug,
    title: program.title,
    category: program.category,
    summary: program.summary,
    duration: program.duration,
    acceptsApplications: program.acceptsApplications,
  };
}

/** Published programs, optionally of one category, ordered by title. */
export async function listPublishedPrograms(
  filters: ProgramFilters,
  limit?: number,
): Promise<ProgramSummary[]> {
  await connectDb();
  const query = ProgramModel.find(
    { status: "PUBLISHED", ...(filters.category ? { category: filters.category } : {}) },
    SUMMARY_FIELDS,
  ).sort({ title: 1 });
  const programs = await (limit ? query.limit(limit) : query).lean();
  return programs.map(toSummary);
}

export async function findPublishedProgramBySlug(slug: string): Promise<ProgramDetail | null> {
  await connectDb();
  const program = await ProgramModel.findOne(
    { slug, status: "PUBLISHED" },
    { ...SUMMARY_FIELDS, description: 1, eligibility: 1, institutionIds: 1 },
  ).lean();
  if (!program) {
    return null;
  }
  const institutions = await InstitutionModel.find(
    { _id: mongoose.trusted({ $in: program.institutionIds }), status: "ACTIVE", isPublic: true },
    { slug: 1, name: 1, city: 1 },
  )
    .sort({ name: 1 })
    .lean();
  return {
    ...toSummary(program),
    description: program.description,
    eligibility: program.eligibility,
    institutions: institutions.map(({ slug: institutionSlug, name, city }) => ({
      slug: institutionSlug,
      name,
      city,
    })),
  };
}
