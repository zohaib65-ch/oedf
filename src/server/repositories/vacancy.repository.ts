import "server-only";
import mongoose from "mongoose";

import type { EMPLOYMENT_TYPES } from "@/lib/constants/enums";
import type { VacancyFilters } from "@/lib/validations/list-params";
import { connectDb } from "@/server/db/connection";
import { DepartmentModel } from "@/server/db/models/department.model";
import { VacancyModel } from "@/server/db/models/vacancy.model";

export interface VacancySummary {
  id: string;
  slug: string;
  title: string;
  departmentName: string;
  departmentSlug: string;
  city: string;
  employmentType: (typeof EMPLOYMENT_TYPES)[number];
  deadline: Date;
}

export interface VacancyDetail extends VacancySummary {
  description: string;
  requirements: string;
  publishedAt: Date | null;
}

const SUMMARY_FIELDS = {
  slug: 1,
  title: 1,
  departmentId: 1,
  city: 1,
  employmentType: 1,
  deadline: 1,
} as const;

interface VacancyRow {
  _id: { toString(): string };
  slug: string;
  title: string;
  departmentId: { toString(): string };
  city: string;
  employmentType: (typeof EMPLOYMENT_TYPES)[number];
  deadline: Date;
}

async function loadDepartments(): Promise<Map<string, { name: string; slug: string }>> {
  const departments = await DepartmentModel.find({}, { name: 1, slug: 1 }).lean();
  return new Map(departments.map((d) => [d._id.toString(), { name: d.name, slug: d.slug }]));
}

function toSummary(
  vacancy: VacancyRow,
  departments: Map<string, { name: string; slug: string }>,
): VacancySummary {
  const department = departments.get(vacancy.departmentId.toString());
  return {
    id: vacancy._id.toString(),
    slug: vacancy.slug,
    title: vacancy.title,
    departmentName: department?.name ?? "",
    departmentSlug: department?.slug ?? "",
    city: vacancy.city,
    employmentType: vacancy.employmentType,
    deadline: vacancy.deadline,
  };
}

/** Published vacancies whose deadline has not passed, soonest deadline first. */
export async function listOpenVacancies(filters: VacancyFilters): Promise<VacancySummary[]> {
  await connectDb();
  const departments = await loadDepartments();
  const departmentId = filters.department
    ? [...departments].find(([, department]) => department.slug === filters.department)?.[0]
    : undefined;
  if (filters.department && !departmentId) {
    return [];
  }
  const vacancies = await VacancyModel.find(
    {
      status: "PUBLISHED",
      deadline: mongoose.trusted({ $gte: new Date() }),
      ...(departmentId ? { departmentId } : {}),
      ...(filters.city ? { city: filters.city } : {}),
      ...(filters.type ? { employmentType: filters.type } : {}),
    },
    SUMMARY_FIELDS,
  )
    .sort({ deadline: 1 })
    .lean();
  return vacancies.map((vacancy) => toSummary(vacancy, departments));
}

/** The cities of the open vacancies, for the filter. */
export async function listOpenVacancyCities(): Promise<string[]> {
  await connectDb();
  const cities = await VacancyModel.distinct("city", {
    status: "PUBLISHED",
    deadline: mongoose.trusted({ $gte: new Date() }),
  });
  return cities.map(String).sort((a, b) => a.localeCompare(b));
}

/** A published vacancy, including one whose deadline has passed (the page then says it is closed). */
export async function findPublishedVacancyBySlug(slug: string): Promise<VacancyDetail | null> {
  await connectDb();
  const vacancy = await VacancyModel.findOne(
    { slug, status: "PUBLISHED" },
    { ...SUMMARY_FIELDS, description: 1, requirements: 1, publishedAt: 1 },
  ).lean();
  if (!vacancy) {
    return null;
  }
  const departments = await loadDepartments();
  return {
    ...toSummary(vacancy, departments),
    description: vacancy.description,
    requirements: vacancy.requirements,
    publishedAt: vacancy.publishedAt ?? null,
  };
}
