import "server-only";
import mongoose from "mongoose";

import { connectDb } from "@/server/db/connection";
import { DepartmentModel } from "@/server/db/models/department.model";
import { InstitutionModel } from "@/server/db/models/institution.model";
import { NewsPostModel } from "@/server/db/models/news-post.model";
import { ProgramModel } from "@/server/db/models/program.model";
import { PublicationModel } from "@/server/db/models/publication.model";
import { VacancyModel } from "@/server/db/models/vacancy.model";

interface SitemapRecord {
  slug: string;
  updatedAt: Date;
}

export interface SitemapRecords {
  departments: SitemapRecord[];
  programs: SitemapRecord[];
  institutions: SitemapRecord[];
  vacancies: SitemapRecord[];
  publications: SitemapRecord[];
  news: SitemapRecord[];
}

/** The slug and last change of every public detail page. */
export async function listSitemapRecords(): Promise<SitemapRecords> {
  await connectDb();
  const fields = { slug: 1, updatedAt: 1 } as const;
  const [departments, programs, institutions, vacancies, publications, news] = await Promise.all([
    DepartmentModel.find({}, fields).lean(),
    ProgramModel.find({ status: "PUBLISHED" }, fields).lean(),
    InstitutionModel.find({ status: "ACTIVE", isPublic: true }, fields).lean(),
    VacancyModel.find(
      { status: "PUBLISHED", deadline: mongoose.trusted({ $gte: new Date() }) },
      fields,
    ).lean(),
    PublicationModel.find({ status: "PUBLISHED" }, fields).lean(),
    NewsPostModel.find({ status: "PUBLISHED" }, fields).lean(),
  ]);
  const toRecords = (rows: { slug: string; updatedAt: Date }[]): SitemapRecord[] =>
    rows.map(({ slug, updatedAt }) => ({ slug, updatedAt }));
  return {
    departments: toRecords(departments),
    programs: toRecords(programs),
    institutions: toRecords(institutions),
    vacancies: toRecords(vacancies),
    publications: toRecords(publications),
    news: toRecords(news),
  };
}
