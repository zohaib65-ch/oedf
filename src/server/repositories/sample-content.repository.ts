import "server-only";
import mongoose from "mongoose";

import type {
  INSTITUTION_TYPES,
  PROGRAM_CATEGORIES,
  PUBLICATION_TYPES,
} from "@/lib/constants/enums";
import { connectDb } from "@/server/db/connection";
import { DepartmentModel } from "@/server/db/models/department.model";
import { FaqModel } from "@/server/db/models/faq.model";
import { InstitutionModel } from "@/server/db/models/institution.model";
import { NewsPostModel } from "@/server/db/models/news-post.model";
import { ProgramModel } from "@/server/db/models/program.model";
import { PublicationModel } from "@/server/db/models/publication.model";
import { SITE_SETTINGS_KEY, SiteSettingsModel } from "@/server/db/models/site-settings.model";
import { VacancyModel } from "@/server/db/models/vacancy.model";

// Development sample content. It exists only so the public pages can be seen with data; the
// script that calls this refuses to run in production.

export interface SampleContent {
  authorId: string;
  authorName: string;
  institutions: {
    slug: string;
    name: string;
    type: (typeof INSTITUTION_TYPES)[number];
    city: string;
    description: string;
  }[];
  programs: {
    slug: string;
    title: string;
    category: (typeof PROGRAM_CATEGORIES)[number];
    summary: string;
    description: string;
    duration: string;
    eligibility: string;
    institutionSlugs: string[];
  }[];
  vacancies: {
    slug: string;
    title: string;
    departmentCode: "HR_TEACHER_MANAGEMENT" | "INSTITUTIONAL_DEVELOPMENT" | "RESEARCH_POLICY";
    city: string;
    employmentType: "FULL_TIME" | "CONTRACT" | "INTERNSHIP";
    description: string;
    requirements: string;
    deadlineInDays: number;
  }[];
  publications: {
    slug: string;
    title: string;
    type: (typeof PUBLICATION_TYPES)[number];
    summary: string;
    authors: string[];
    publishedOn: Date;
  }[];
  news: {
    slug: string;
    title: string;
    type: "NEWS" | "EVENT";
    excerpt: string;
    body: string;
    publishedAt: Date;
    eventDate?: Date;
    venue?: string;
  }[];
  faqs: { question: string; answer: string; category: string; order: number }[];
  impactNumbers: { label: string; value: number }[];
}

const DAY_MS = 86_400_000;

/** Adds the sample records that are missing. Existing records are left as they are. */
export async function ensureSampleContent(sample: SampleContent): Promise<void> {
  await connectDb();

  await InstitutionModel.bulkWrite(
    sample.institutions.map((institution) => ({
      updateOne: {
        filter: { slug: institution.slug },
        update: { $setOnInsert: { ...institution, status: "ACTIVE", isPublic: true } },
        upsert: true,
      },
    })),
  );
  const institutions = await InstitutionModel.find({}, { slug: 1 }).lean();
  const institutionIds = new Map(institutions.map((i) => [i.slug, i._id]));

  await ProgramModel.bulkWrite(
    sample.programs.map(({ institutionSlugs, ...program }) => ({
      updateOne: {
        filter: { slug: program.slug },
        update: {
          $setOnInsert: {
            ...program,
            status: "PUBLISHED",
            acceptsApplications: true,
            institutionIds: institutionSlugs.flatMap((slug) => institutionIds.get(slug) ?? []),
          },
        },
        upsert: true,
      },
    })),
  );

  const departments = await DepartmentModel.find({}, { code: 1 }).lean();
  const departmentIds = new Map(departments.map((d) => [d.code, d._id]));
  await VacancyModel.bulkWrite(
    sample.vacancies.flatMap(({ departmentCode, deadlineInDays, ...vacancy }) => {
      const departmentId = departmentIds.get(departmentCode);
      return departmentId
        ? [
            {
              updateOne: {
                filter: { slug: vacancy.slug },
                update: {
                  $setOnInsert: {
                    ...vacancy,
                    departmentId,
                    deadline: new Date(Date.now() + deadlineInDays * DAY_MS),
                    status: "PUBLISHED",
                    publishedAt: new Date(),
                  },
                },
                upsert: true,
              },
            },
          ]
        : [];
    }),
  );

  await PublicationModel.bulkWrite(
    sample.publications.map((publication) => ({
      updateOne: {
        filter: { slug: publication.slug },
        update: { $setOnInsert: { ...publication, status: "PUBLISHED" } },
        upsert: true,
      },
    })),
  );

  await NewsPostModel.bulkWrite(
    sample.news.map((post) => ({
      updateOne: {
        filter: { slug: post.slug },
        update: {
          $setOnInsert: {
            ...post,
            status: "PUBLISHED",
            authorId: sample.authorId,
            authorName: sample.authorName,
          },
        },
        upsert: true,
      },
    })),
  );

  await FaqModel.bulkWrite(
    sample.faqs.map((faq) => ({
      updateOne: {
        filter: { question: faq.question },
        update: { $setOnInsert: { ...faq, isPublished: true } },
        upsert: true,
      },
    })),
  );

  // Applications are open in development, so the forms can be tried.
  await SiteSettingsModel.updateOne(
    { key: SITE_SETTINGS_KEY },
    { $set: { admissionsOpen: true, scholarshipsOpen: true } },
  );

  // Impact numbers are only filled in while the list is empty, so numbers entered in the portal are kept.
  await SiteSettingsModel.updateOne(
    { key: SITE_SETTINGS_KEY, "impactNumbers.0": mongoose.trusted({ $exists: false }) },
    { $set: { impactNumbers: sample.impactNumbers } },
  );
}
