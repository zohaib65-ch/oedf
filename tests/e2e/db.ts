import { randomInt } from "node:crypto";

import { MongoClient, ObjectId, type Db } from "mongodb";

async function withDb<T>(work: (db: Db) => Promise<T>): Promise<T> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is needed to prepare test records.");
  }
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
