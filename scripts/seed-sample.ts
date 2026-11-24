import { setTimeout as delay } from "node:timers/promises";

import mongoose from "mongoose";

import { getAuth } from "@/server/auth/auth";
import { connectDb } from "@/server/db/connection";
import {
  ensureSampleContent,
  type SampleContent,
} from "@/server/repositories/sample-content.repository";

// Development only: fills the public pages with clearly labelled sample content so the layout can be
// reviewed. It never runs in production, and real content is entered in the portal.

const AUTH_INDEX_GRACE_MS = 1000;
const MONTH_MS = 30 * 86_400_000;

function daysAgo(days: number): Date {
  return new Date(Date.now() - days * 86_400_000 - MONTH_MS);
}

const SAMPLE_NOTE = "Sample content for development. Not real information.";

function buildSample(authorId: string, authorName: string): SampleContent {
  return {
    authorId,
    authorName,
    institutions: [
      {
        slug: "sample-community-school",
        name: "Sample Community School",
        type: "SCHOOL",
        city: "Vehari",
        description: SAMPLE_NOTE,
      },
      {
        slug: "sample-skills-center",
        name: "Sample Skills Center",
        type: "SKILLS_CENTER",
        city: "Multan",
        description: SAMPLE_NOTE,
      },
      {
        slug: "sample-training-center",
        name: "Sample Training Center",
        type: "TRAINING_CENTER",
        city: "Vehari",
        description: SAMPLE_NOTE,
      },
    ],
    programs: [
      {
        slug: "sample-web-development",
        title: "Sample: Web development",
        category: "SKILLS",
        summary: "An introduction to building websites. Sample text.",
        description: `${SAMPLE_NOTE}\n\nA second paragraph shows how longer text wraps on the page.`,
        duration: "6 months",
        eligibility: SAMPLE_NOTE,
        institutionSlugs: ["sample-skills-center"],
      },
      {
        slug: "sample-freelancing",
        title: "Sample: Freelancing basics",
        category: "VOCATIONAL",
        summary: "How to find and deliver online work. Sample text.",
        description: SAMPLE_NOTE,
        duration: "3 months",
        eligibility: SAMPLE_NOTE,
        institutionSlugs: ["sample-skills-center", "sample-training-center"],
      },
      {
        slug: "sample-matric-support",
        title: "Sample: Secondary school support",
        category: "EDUCATION",
        summary: "Support for learners in the final years of school. Sample text.",
        description: SAMPLE_NOTE,
        duration: "1 year",
        eligibility: SAMPLE_NOTE,
        institutionSlugs: ["sample-community-school"],
      },
    ],
    vacancies: [
      {
        slug: "sample-teacher",
        title: "Sample: Teacher",
        departmentCode: "HR_TEACHER_MANAGEMENT",
        city: "Vehari",
        employmentType: "FULL_TIME",
        description: SAMPLE_NOTE,
        requirements: SAMPLE_NOTE,
        deadlineInDays: 20,
      },
      {
        slug: "sample-research-intern",
        title: "Sample: Research intern",
        departmentCode: "RESEARCH_POLICY",
        city: "Multan",
        employmentType: "INTERNSHIP",
        description: SAMPLE_NOTE,
        requirements: SAMPLE_NOTE,
        deadlineInDays: 10,
      },
    ],
    publications: [
      {
        slug: "sample-literacy-report",
        title: "Sample: Literacy report",
        type: "RESEARCH_REPORT",
        summary: "A sample report summary.",
        authors: ["Sample Author"],
        publishedOn: daysAgo(60),
      },
      {
        slug: "sample-policy-paper",
        title: "Sample: Education policy paper",
        type: "POLICY_PAPER",
        summary: "A sample policy paper summary.",
        authors: ["Sample Author"],
        publishedOn: daysAgo(120),
      },
      {
        slug: "sample-brief",
        title: "Sample: Scholarship brief",
        type: "BRIEF",
        summary: "A sample brief summary.",
        authors: [],
        publishedOn: daysAgo(400),
      },
    ],
    news: [
      {
        slug: "sample-announcement",
        title: "Sample: Foundation announcement",
        type: "NEWS",
        excerpt: "A short sample excerpt.",
        body: `${SAMPLE_NOTE}\n\nA second paragraph of the sample article.`,
        publishedAt: daysAgo(30),
      },
      {
        slug: "sample-update",
        title: "Sample: Program update",
        type: "NEWS",
        excerpt: "Another short sample excerpt.",
        body: SAMPLE_NOTE,
        publishedAt: daysAgo(70),
      },
      {
        slug: "sample-event",
        title: "Sample: Open day",
        type: "EVENT",
        excerpt: "A sample event.",
        body: SAMPLE_NOTE,
        publishedAt: daysAgo(10),
        eventDate: new Date(Date.now() + 14 * 86_400_000),
        venue: "Sample venue",
      },
    ],
    faqs: [
      { question: "Sample: Who can apply?", answer: SAMPLE_NOTE, category: "Admissions", order: 1 },
      {
        question: "Sample: Which documents do I need?",
        answer: SAMPLE_NOTE,
        category: "Admissions",
        order: 2,
      },
      {
        question: "Sample: How are scholarships decided?",
        answer: SAMPLE_NOTE,
        category: "Scholarships",
        order: 1,
      },
      {
        question: "Sample: How do I check my status?",
        answer: SAMPLE_NOTE,
        category: "Scholarships",
        order: 2,
      },
    ],
    impactNumbers: [
      { label: "Sample learners supported", value: 1200 },
      { label: "Sample partner institutions", value: 12 },
      { label: "Sample programs", value: 8 },
      { label: "Sample reports published", value: 15 },
    ],
  };
}

async function seedSample(): Promise<void> {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Sample content is for development only and is never added in production.");
  }
  await connectDb();
  const context = await (await getAuth()).$context;
  const admin = await context.adapter.findOne<{ id: string; name: string }>({
    model: "user",
    where: [{ field: "role", value: "SUPER_ADMIN" }],
  });
  if (!admin) {
    throw new Error("Run `npm run db:seed` first: the sample news posts need an author.");
  }
  await ensureSampleContent(buildSample(admin.id, admin.name));
  console.info("Sample content added (existing records were left as they are).");
}

try {
  await seedSample();
} catch (error: unknown) {
  console.error(error);
  process.exitCode = 1;
} finally {
  await delay(AUTH_INDEX_GRACE_MS);
  await mongoose.disconnect();
}
