import "server-only";
import mongoose from "mongoose";

import { connectDb } from "@/server/db/connection";
import { ApplicationModel } from "@/server/db/models/application.model";
import { ContactMessageModel } from "@/server/db/models/contact-message.model";
import { DirectiveModel } from "@/server/db/models/directive.model";
import { JobApplicationModel } from "@/server/db/models/job-application.model";
import { ScholarshipAwardModel } from "@/server/db/models/scholarship-award.model";
import { VacancyModel } from "@/server/db/models/vacancy.model";

const DAY_MS = 86_400_000;
const WEEK_DAYS = 7;
const RENEWAL_WINDOW_DAYS = 30;
const MONTH_TIME_ZONE = "Asia/Karachi";

/** Counts only: nothing here returns a person's details. */
export async function countNewApplications(): Promise<number> {
  await connectDb();
  return ApplicationModel.countDocuments({
    createdAt: mongoose.trusted({ $gte: new Date(Date.now() - WEEK_DAYS * DAY_MS) }),
  });
}

export async function countPendingVerification(): Promise<number> {
  await connectDb();
  return ApplicationModel.countDocuments({
    status: mongoose.trusted({ $in: ["SUBMITTED", "UNDER_REVIEW"] }),
  });
}

export async function countOpenVacancies(): Promise<number> {
  await connectDb();
  return VacancyModel.countDocuments({
    status: "PUBLISHED",
    deadline: mongoose.trusted({ $gte: new Date() }),
  });
}

export async function countCandidatesToScreen(): Promise<number> {
  await connectDb();
  return JobApplicationModel.countDocuments({
    status: "RECEIVED",
    archivedAt: mongoose.trusted({ $exists: false }),
  });
}

export async function countRenewalsDue(): Promise<number> {
  await connectDb();
  const now = new Date();
  return ScholarshipAwardModel.countDocuments({
    status: "ACTIVE",
    renewalDate: mongoose.trusted({
      $gte: now,
      $lte: new Date(now.getTime() + RENEWAL_WINDOW_DAYS * DAY_MS),
    }),
  });
}

/** Unread messages, for one office or (with no office) for all of them. */
export async function countUnreadMessages(departmentId: string | null): Promise<number> {
  await connectDb();
  return ContactMessageModel.countDocuments({
    status: "NEW",
    ...(departmentId ? { departmentId } : {}),
  });
}

/** Directives with an office that has not acknowledged yet, for one office or all of them. */
export async function countAwaitingAcknowledgement(departmentId: string | null): Promise<number> {
  await connectDb();
  const match = {
    status: "PENDING_ACKNOWLEDGEMENT",
    ...(departmentId ? { departmentId: new mongoose.Types.ObjectId(departmentId) } : {}),
  };
  return DirectiveModel.countDocuments({
    assignments: mongoose.trusted({ $elemMatch: match }),
  });
}

/** Directives past their due date that an office (or any office) has not completed. */
export async function countOverdueDirectives(departmentId: string | null): Promise<number> {
  await connectDb();
  const open = {
    status: mongoose.trusted({ $ne: "COMPLETED" }),
    ...(departmentId ? { departmentId: new mongoose.Types.ObjectId(departmentId) } : {}),
  };
  return DirectiveModel.countDocuments({
    dueDate: mongoose.trusted({ $lt: new Date() }),
    assignments: mongoose.trusted({ $elemMatch: open }),
  });
}

export interface MonthlyApplications {
  /** `YYYY-MM`, in Pakistan time. */
  month: string;
  admissions: number;
  scholarships: number;
}

/** Applications received in each of the last 12 months, split by type. Months with none are included. */
export async function countApplicationsByMonth(months: number): Promise<MonthlyApplications[]> {
  await connectDb();
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (months - 1), 1));
  const rows = await ApplicationModel.aggregate<{
    _id: { month: string; type: string };
    count: number;
  }>([
    { $match: { createdAt: { $gte: start } } },
    {
      $group: {
        _id: {
          month: {
            $dateToString: { format: "%Y-%m", date: "$createdAt", timezone: MONTH_TIME_ZONE },
          },
          type: "$type",
        },
        count: { $sum: 1 },
      },
    },
  ]);
  return Array.from({ length: months }, (_, index) => {
    const date = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + index, 1));
    const month = date.toISOString().slice(0, 7);
    const count = (type: string) =>
      rows.find((row) => row._id.month === month && row._id.type === type)?.count ?? 0;
    return { month, admissions: count("ADMISSION"), scholarships: count("SCHOLARSHIP") };
  });
}
