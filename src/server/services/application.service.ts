import "server-only";

import { PUBLIC_APPLICATION_STATUS } from "@/lib/constants/application-status";
import type { DOCUMENT_KINDS } from "@/lib/constants/enums";
import { formatDate } from "@/lib/format";
import type {
  ApplicationInput,
  MissingDocumentsInput,
  StatusLookupInput,
} from "@/lib/validations/application";
import type { UploadedFile } from "@/lib/validations/common";
import { newId } from "@/server/db/object-id";
import { withTransaction } from "@/server/db/transaction";
import { sendEmail } from "@/server/email/send-email";
import { ApplicationReceivedEmail } from "@/server/email/templates/application-received-email";
import { AppError } from "@/server/http/errors";
import {
  addMissingDocuments,
  createApplication,
  findApplicationForLookup,
  type ApplicationStatusRecord,
} from "@/server/repositories/application.repository";
import { nextSequence } from "@/server/repositories/counter.repository";
import {
  createFileAssets,
  FILE_OWNER_TYPES,
  type NewFileAsset,
} from "@/server/repositories/file-asset.repository";
import { isProgramAcceptingApplications } from "@/server/repositories/program.repository";
import { findPublicSiteSettings } from "@/server/repositories/site-settings.repository";
import { verifyUploads, type VerifiedUpload } from "@/server/services/upload-verification";
import { markUploadsConfirmed } from "@/server/storage/cloudinary";

type DocumentKind = (typeof DOCUMENT_KINDS)[number];

const REFERENCE_PREFIX = { ADMISSION: "ADM", SCHOLARSHIP: "SCH" } as const;
const SEQUENCE_DIGITS = 6;
const LOOKUP_NOT_FOUND = "We could not find an application with that reference number and email.";

function toFileAsset(upload: VerifiedUpload, id: string, ownerId: string): NewFileAsset {
  return {
    id,
    publicId: upload.file.publicId,
    resourceType: upload.file.resourceType,
    format: upload.format,
    bytes: upload.bytes,
    originalName: upload.file.originalName,
    purpose: "APPLICATION_DOCUMENT",
    ownerType: FILE_OWNER_TYPES.application,
    ownerId,
  };
}

/** Saves an admission or scholarship application and emails the applicant their reference number. */
export async function submitApplication(
  input: ApplicationInput,
): Promise<{ referenceNumber: string }> {
  const settings = await findPublicSiteSettings();
  const isOpen = input.type === "ADMISSION" ? settings?.admissionsOpen : settings?.scholarshipsOpen;
  if (!isOpen) {
    throw new AppError(
      "CONFLICT",
      input.type === "ADMISSION"
        ? "Admissions are not open right now."
        : "Scholarship applications are not open right now.",
    );
  }
  if (input.programId && !(await isProgramAcceptingApplications(input.programId))) {
    const message = "This program is not accepting applications.";
    throw new AppError("VALIDATION_ERROR", message, { fieldErrors: { programId: [message] } });
  }

  const { documents } = input;
  const kindByField: { kind: DocumentKind; field: string; file: UploadedFile }[] = [
    { kind: "PHOTO", field: "documents.photo", file: documents.photo },
    { kind: "IDENTITY", field: "documents.identity", file: documents.identity },
    { kind: "RESULT_CARD", field: "documents.resultCard", file: documents.resultCard },
  ];
  if (input.type === "SCHOLARSHIP") {
    kindByField.push({
      kind: "INCOME_PROOF",
      field: "documents.incomeProof",
      file: input.documents.incomeProof,
    });
  }
  const verified = await verifyUploads(kindByField, "APPLICATION_DOCUMENT");

  const year = new Date().getUTCFullYear();
  const prefix = REFERENCE_PREFIX[input.type];
  const applicationId = newId();
  const files = verified.map((upload, index) => ({
    upload,
    id: newId(),
    kind: kindByField[index]?.kind ?? "OTHER",
  }));

  const referenceNumber = await withTransaction(async (session) => {
    const sequence = await nextSequence(`${prefix}-${year}`, session);
    const reference = `OEDF-${prefix}-${year}-${String(sequence).padStart(SEQUENCE_DIGITS, "0")}`;
    await createFileAssets(
      files.map(({ upload, id }) => toFileAsset(upload, id, applicationId)),
      session,
    );
    await createApplication(
      {
        id: applicationId,
        referenceNumber: reference,
        type: input.type,
        programId: input.programId,
        intakeSession: input.intakeSession,
        applicant: {
          ...input.applicant,
          dateOfBirth: new Date(`${input.applicant.dateOfBirth}T00:00:00Z`),
        },
        education: input.education,
        financial: input.type === "SCHOLARSHIP" ? input.financial : undefined,
        documents: files.map(({ kind, id }) => ({ kind, fileId: id })),
      },
      session,
    );
    return reference;
  });

  // Only now that the database has the files is it safe to stop the cleanup job from deleting them.
  await markUploadsConfirmed(verified.map(({ file }) => file));
  await sendEmail({
    to: input.applicant.email,
    subject: `We received your application (${referenceNumber})`,
    template: ApplicationReceivedEmail({
      applicantName: input.applicant.fullName,
      referenceNumber,
      type: input.type,
    }),
  });
  return { referenceNumber };
}

export interface PublicApplicationStatus {
  status: ApplicationStatusRecord["status"];
  label: string;
  nextStep: string;
  /** What staff asked for. Only filled while the application is Incomplete. */
  missingItems: string[];
  /** Why the scholarship ended, when staff ended it after approving. */
  endedReason: string | null;
}

/** Finds an application by reference number and email. A mismatch of either gives the same answer. */
async function findOwnedApplication({
  referenceNumber,
  email,
}: StatusLookupInput): Promise<ApplicationStatusRecord> {
  const application = await findApplicationForLookup(referenceNumber);
  if (application?.email !== email) {
    throw new AppError("NOT_FOUND", LOOKUP_NOT_FOUND);
  }
  return application;
}

/** The status and next step only, never the applicant's personal details. */
export async function lookupApplicationStatus(
  input: StatusLookupInput,
): Promise<PublicApplicationStatus> {
  const application = await findOwnedApplication(input);
  if (application.scholarshipEnded) {
    return {
      status: application.status,
      label: "Scholarship ended",
      nextStep: `Your scholarship ended on ${formatDate(new Date(application.scholarshipEnded.endedAt))}. If you have questions, contact us.`,
      missingItems: [],
      endedReason: application.scholarshipEnded.reason,
    };
  }
  const { label, nextStep } = PUBLIC_APPLICATION_STATUS[application.status];
  return {
    status: application.status,
    label,
    nextStep,
    missingItems: application.status === "INCOMPLETE" ? application.missingItems : [],
    endedReason: null,
  };
}

/** Adds the documents an applicant was asked for, and returns the application to Under review. */
export async function submitMissingDocuments(
  input: MissingDocumentsInput,
): Promise<PublicApplicationStatus> {
  const application = await findOwnedApplication(input);
  if (application.status !== "INCOMPLETE" || application.isArchived) {
    throw new AppError("CONFLICT", "This application is not asking for documents right now.");
  }

  const verified = await verifyUploads(
    input.documents.map(({ file }, index) => ({ field: `documents.${index}.file`, file })),
    "APPLICATION_DOCUMENT",
  );
  const files = verified.map((upload, index) => ({
    upload,
    id: newId(),
    kind: input.documents[index]?.kind ?? "OTHER",
  }));

  await withTransaction(async (session) => {
    await createFileAssets(
      files.map(({ upload, id }) => toFileAsset(upload, id, application.id)),
      session,
    );
    const isUpdated = await addMissingDocuments(
      application.id,
      files.map(({ kind, id }) => ({ kind, fileId: id })),
      session,
    );
    if (!isUpdated) {
      throw new AppError("CONFLICT", "This application is not asking for documents right now.");
    }
  });
  await markUploadsConfirmed(verified.map(({ file }) => file));

  const { label, nextStep } = PUBLIC_APPLICATION_STATUS.UNDER_REVIEW;
  return { status: "UNDER_REVIEW", label, nextStep, missingItems: [], endedReason: null };
}
