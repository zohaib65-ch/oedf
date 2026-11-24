import "server-only";

import { ApplicationModel } from "@/server/db/models/application.model";
import { AuditLogModel } from "@/server/db/models/audit-log.model";
import { ContactMessageModel } from "@/server/db/models/contact-message.model";
import { CounterModel } from "@/server/db/models/counter.model";
import { DepartmentModel } from "@/server/db/models/department.model";
import { DirectiveModel } from "@/server/db/models/directive.model";
import { FaqModel } from "@/server/db/models/faq.model";
import { FileAssetModel } from "@/server/db/models/file-asset.model";
import { InstitutionModel } from "@/server/db/models/institution.model";
import { JobApplicationModel } from "@/server/db/models/job-application.model";
import { NewsPostModel } from "@/server/db/models/news-post.model";
import { ProgramModel } from "@/server/db/models/program.model";
import { PublicationModel } from "@/server/db/models/publication.model";
import { RateLimitModel } from "@/server/db/models/rate-limit.model";
import { ScholarshipAwardModel } from "@/server/db/models/scholarship-award.model";
import { SiteSettingsModel } from "@/server/db/models/site-settings.model";
import { VacancyModel } from "@/server/db/models/vacancy.model";

/** Every collection this app owns (Better Auth creates its own). Used by index sync and its test. */
export const ALL_MODELS = [
  ApplicationModel,
  AuditLogModel,
  ContactMessageModel,
  CounterModel,
  DepartmentModel,
  DirectiveModel,
  FaqModel,
  FileAssetModel,
  InstitutionModel,
  JobApplicationModel,
  NewsPostModel,
  ProgramModel,
  PublicationModel,
  RateLimitModel,
  ScholarshipAwardModel,
  SiteSettingsModel,
  VacancyModel,
];
