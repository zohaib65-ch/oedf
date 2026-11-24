import "server-only";
import type { ClientSession } from "mongoose";

import { JobApplicationModel } from "@/server/db/models/job-application.model";

export interface NewJobApplication {
  id: string;
  referenceNumber: string;
  vacancyId: string;
  cvFileId: string;
  candidate: {
    fullName: string;
    email: string;
    phone: string;
    cnic: string;
    city: string;
    highestQualification: string;
    yearsOfExperience: number;
    coverLetter: string;
  };
}

export async function createJobApplication(
  data: NewJobApplication,
  session: ClientSession,
): Promise<void> {
  const { id, ...fields } = data;
  await JobApplicationModel.create(
    [
      {
        _id: id,
        ...fields,
        status: "RECEIVED",
        statusHistory: [{ to: "RECEIVED", reason: "Application received", actorName: "Candidate" }],
      },
    ],
    { session },
  );
}
