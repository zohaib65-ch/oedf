import "server-only";

import { hasPassed } from "@/lib/format";
import type { JobApplicationInput } from "@/lib/validations/job-application";
import { newId } from "@/server/db/object-id";
import { withTransaction } from "@/server/db/transaction";
import { sendEmail } from "@/server/email/send-email";
import { JobApplicationReceivedEmail } from "@/server/email/templates/job-application-received-email";
import { AppError } from "@/server/http/errors";
import { nextSequence } from "@/server/repositories/counter.repository";
import { createFileAssets, FILE_OWNER_TYPES } from "@/server/repositories/file-asset.repository";
import { createJobApplication } from "@/server/repositories/job-application.repository";
import { findPublishedVacancyBySlug } from "@/server/repositories/vacancy.repository";
import { verifyUploads } from "@/server/services/upload-verification";
import { markUploadsConfirmed } from "@/server/storage/cloudinary";

const SEQUENCE_DIGITS = 6;

/** Saves a job application with its CV and emails the candidate a confirmation. */
export async function submitJobApplication(
  input: JobApplicationInput,
): Promise<{ referenceNumber: string }> {
  const vacancy = await findPublishedVacancyBySlug(input.vacancySlug);
  if (!vacancy) {
    throw new AppError("NOT_FOUND", "This vacancy could not be found.");
  }
  if (hasPassed(vacancy.deadline)) {
    throw new AppError("CONFLICT", "The deadline for this vacancy has passed.");
  }

  const [cv] = await verifyUploads([{ field: "cv", file: input.cv }], "CV");
  if (!cv) {
    throw new AppError("VALIDATION_ERROR", "Upload your CV.");
  }

  const year = new Date().getUTCFullYear();
  const applicationId = newId();
  const cvFileId = newId();

  const referenceNumber = await withTransaction(async (session) => {
    const sequence = await nextSequence(`JOB-${year}`, session);
    const reference = `OEDF-JOB-${year}-${String(sequence).padStart(SEQUENCE_DIGITS, "0")}`;
    await createFileAssets(
      [
        {
          id: cvFileId,
          publicId: cv.file.publicId,
          resourceType: cv.file.resourceType,
          format: cv.format,
          bytes: cv.bytes,
          originalName: cv.file.originalName,
          purpose: "CV",
          ownerType: FILE_OWNER_TYPES.jobApplication,
          ownerId: applicationId,
        },
      ],
      session,
    );
    await createJobApplication(
      {
        id: applicationId,
        referenceNumber: reference,
        vacancyId: vacancy.id,
        cvFileId,
        candidate: {
          fullName: input.fullName,
          email: input.email,
          phone: input.phone,
          cnic: input.cnic,
          city: input.city,
          highestQualification: input.highestQualification,
          yearsOfExperience: input.yearsOfExperience,
          coverLetter: input.coverLetter,
        },
      },
      session,
    );
    return reference;
  });

  await markUploadsConfirmed([cv.file]);
  await sendEmail({
    to: input.email,
    subject: `We received your application (${referenceNumber})`,
    template: JobApplicationReceivedEmail({
      candidateName: input.fullName,
      vacancyTitle: vacancy.title,
      referenceNumber,
    }),
  });
  return { referenceNumber };
}
