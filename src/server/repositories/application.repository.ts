import "server-only";
import mongoose, { type ClientSession } from "mongoose";

import type {
  APPLICATION_STATUSES,
  APPLICATION_TYPES,
  DOCUMENT_KINDS,
  GENDERS,
} from "@/lib/constants/enums";
import { connectDb } from "@/server/db/connection";
import { ApplicationModel } from "@/server/db/models/application.model";

type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];
type DocumentKind = (typeof DOCUMENT_KINDS)[number];

export interface NewApplication {
  id: string;
  referenceNumber: string;
  type: (typeof APPLICATION_TYPES)[number];
  programId: string | undefined;
  intakeSession: string;
  applicant: {
    fullName: string;
    guardianName: string;
    dateOfBirth: Date;
    gender: (typeof GENDERS)[number];
    cnic: string;
    email: string;
    phone: string;
    address: string;
    city: string;
  };
  education: {
    lastInstitution: string;
    classOrDegree: string;
    boardOrUniversity: string;
    marksOrPercentage: string;
    passingYear: number;
  };
  financial:
    | {
        monthlyIncomePkr: number;
        familySize: number;
        guardianOccupation: string;
        otherSupport: string;
        statementOfNeed: string;
      }
    | undefined;
  documents: { kind: DocumentKind; fileId: string }[];
}

export async function createApplication(
  data: NewApplication,
  session: ClientSession,
): Promise<void> {
  const { id, ...fields } = data;
  await ApplicationModel.create(
    [
      {
        _id: id,
        ...fields,
        status: "SUBMITTED",
        statusHistory: [
          { to: "SUBMITTED", reason: "Application submitted", actorName: "Applicant" },
        ],
      },
    ],
    { session },
  );
}

/** What the public status page may see: never the applicant's personal details. */
export interface ApplicationStatusRecord {
  id: string;
  type: (typeof APPLICATION_TYPES)[number];
  status: ApplicationStatus;
  /** The applicant's email as saved, used only to check the lookup. */
  email: string;
  missingItems: string[];
  /** Archived by staff: read-only until restored, so it takes no documents either. */
  isArchived: boolean;
}

export async function findApplicationForLookup(
  referenceNumber: string,
): Promise<ApplicationStatusRecord | null> {
  await connectDb();
  const application = await ApplicationModel.findOne(
    { referenceNumber },
    { type: 1, status: 1, "applicant.email": 1, missingItems: 1, archivedAt: 1 },
  ).lean();
  return application
    ? {
        id: application._id.toString(),
        type: application.type,
        status: application.status,
        email: application.applicant.email,
        missingItems: application.missingItems,
        isArchived: application.archivedAt != null,
      }
    : null;
}

/**
 * Adds the requested documents and moves the application from Incomplete back to Under review.
 * Returns false when it was no longer Incomplete or was archived (so nothing changed).
 */
export async function addMissingDocuments(
  id: string,
  documents: readonly { kind: DocumentKind; fileId: string }[],
  session: ClientSession,
): Promise<boolean> {
  const result = await ApplicationModel.updateOne(
    { _id: id, status: "INCOMPLETE", archivedAt: mongoose.trusted({ $exists: false }) },
    {
      $push: {
        documents: { $each: documents },
        statusHistory: {
          from: "INCOMPLETE",
          to: "UNDER_REVIEW",
          reason: "Applicant uploaded the requested documents",
          actorName: "Applicant",
        },
      },
      $set: { status: "UNDER_REVIEW", missingItems: [] },
    },
    { session },
  );
  return result.modifiedCount === 1;
}
