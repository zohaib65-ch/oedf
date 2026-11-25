import { randomInt } from "node:crypto";

import { MongoClient, ObjectId, type Db } from "mongodb";

import { assertTestDatabase } from "./test-database";

async function withDb<T>(work: (db: Db) => Promise<T>): Promise<T> {
  const uri = process.env.MONGODB_URI ?? "";
  assertTestDatabase(uri);
  const client = await MongoClient.connect(uri);
  try {
    return await work(client.db());
  } finally {
    await client.close();
  }
}

export interface TestApplication {
  id: string;
  referenceNumber: string;
}

/**
 * Puts a submitted application straight into the database, the way the public form saves one,
 * so the review screens can be tested without uploading real files. The year 2099 keeps its
 * reference number clear of real ones.
 */
export async function insertTestApplication(
  type: "ADMISSION" | "SCHOLARSHIP",
  fullName: string,
): Promise<TestApplication> {
  const id = new ObjectId();
  const prefix = type === "ADMISSION" ? "ADM" : "SCH";
  const referenceNumber = `OEDF-${prefix}-2099-${String(randomInt(0, 999_999)).padStart(6, "0")}`;
  const now = new Date();
  await withDb((db) =>
    db.collection("applications").insertOne({
      _id: id,
      referenceNumber,
      type,
      status: "SUBMITTED",
      intakeSession: "Fall 2026",
      applicant: {
        fullName,
        guardianName: "Test Guardian",
        dateOfBirth: new Date("2008-04-12T00:00:00Z"),
        gender: "FEMALE",
        cnic: `35202${String(randomInt(0, 99_999_999)).padStart(8, "0")}`,
        email: `e2e.${String(randomInt(100_000, 999_999))}@example.org`,
        phone: "0300 1234567",
        address: "House 1, Street 2",
        city: "Vehari",
      },
      education: {
        lastInstitution: "Govt High School",
        classOrDegree: "Matric",
        boardOrUniversity: "BISE Multan",
        marksOrPercentage: "85%",
        passingYear: 2024,
      },
      ...(type === "SCHOLARSHIP"
        ? {
            financial: {
              monthlyIncomePkr: 40_000,
              familySize: 6,
              guardianOccupation: "Shopkeeper",
              otherSupport: "",
              statementOfNeed: "We cannot afford the fees.",
            },
          }
        : {}),
      documents: [],
      checklist: { identity: false, education: false, eligibility: false, documents: false },
      missingItems: [],
      notes: [],
      statusHistory: [
        { to: "SUBMITTED", reason: "Application submitted", actorName: "Applicant", at: now },
      ],
      createdAt: now,
      updatedAt: now,
    }),
  );
  return { id: id.toString(), referenceNumber };
}

/** Removes a test application and any award made from it. */
export async function deleteTestApplication(id: string): Promise<void> {
  await withDb(async (db) => {
    const objectId = new ObjectId(id);
    await db.collection("applications").deleteOne({ _id: objectId });
    await db.collection("scholarshipAwards").deleteMany({ applicationId: objectId });
  });
}

export interface TestJobApplication {
  id: string;
  referenceNumber: string;
  vacancyId: string;
  vacancyTitle: string;
}

/**
 * Puts a published test vacancy and one application to it straight into the database, the way
 * the public form saves one, so the review screens can be tested without uploading a real CV.
 */
export async function insertTestJobApplication(fullName: string): Promise<TestJobApplication> {
  const suffix = String(randomInt(100_000, 999_999));
  const vacancyId = new ObjectId();
  const vacancyTitle = `E2E Vacancy ${suffix}`;
  const id = new ObjectId();
  const referenceNumber = `OEDF-JOB-2099-${suffix}`;
  const now = new Date();
  await withDb(async (db) => {
    const office = await db.collection("departments").findOne({ code: "HR_TEACHER_MANAGEMENT" });
    await db.collection("vacancies").insertOne({
      _id: vacancyId,
      slug: `e2e-vacancy-${suffix}`,
      title: vacancyTitle,
      departmentId: office?._id ?? new ObjectId(),
      city: "Vehari",
      employmentType: "FULL_TIME",
      description: "Created by an end-to-end test.",
      requirements: "",
      deadline: new Date(now.getTime() + 7 * 86_400_000),
      status: "PUBLISHED",
      publishedAt: now,
      createdAt: now,
      updatedAt: now,
    });
    await db.collection("jobApplications").insertOne({
      _id: id,
      referenceNumber,
      vacancyId,
      status: "RECEIVED",
      cvFileId: new ObjectId(),
      candidate: {
        fullName,
        email: `e2e.${suffix}@example.org`,
        phone: "0300 1234567",
        cnic: `35202${String(randomInt(0, 99_999_999)).padStart(8, "0")}`,
        city: "Vehari",
        highestQualification: "MA Education",
        yearsOfExperience: 4,
        coverLetter: "I would like to teach at the foundation.",
      },
      notes: [],
      statusHistory: [
        { to: "RECEIVED", reason: "Application received", actorName: "Candidate", at: now },
      ],
      createdAt: now,
      updatedAt: now,
    });
  });
  return { id: id.toString(), referenceNumber, vacancyId: vacancyId.toString(), vacancyTitle };
}

/** Removes a test job application and its vacancy. */
export async function deleteTestJobApplication(application: TestJobApplication): Promise<void> {
  await withDb(async (db) => {
    await db.collection("jobApplications").deleteOne({ _id: new ObjectId(application.id) });
    await db.collection("vacancies").deleteOne({ _id: new ObjectId(application.vacancyId) });
  });
}

/** Removes vacancies a test created through the portal, by their exact title. */
export async function deleteVacanciesByTitle(title: string): Promise<void> {
  await withDb(async (db) => {
    await db.collection("vacancies").deleteMany({ title });
  });
}

/** Moves a test directive's due date into the past, which the portal never allows, to show it overdue. */
export async function makeDirectiveOverdue(id: string): Promise<void> {
  const yesterday = new Date(Date.now() - 2 * 86_400_000);
  yesterday.setUTCHours(0, 0, 0, 0);
  await withDb((db) =>
    db
      .collection("directives")
      .updateOne({ _id: new ObjectId(id) }, { $set: { dueDate: yesterday } }),
  );
}
