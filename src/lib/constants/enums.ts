/**
 * Every enum is defined once here and used by both the Mongoose schemas and the Zod schemas.
 * Values are stored as strings.
 */

export const ROLES = ["SUPER_ADMIN", "CEO_OFFICE", "DIRECTOR", "STAFF"] as const;

export const DEPARTMENT_CODES = [
  "CEO_OFFICE",
  "ADMISSIONS_SCHOLARSHIPS",
  "HR_TEACHER_MANAGEMENT",
  "INSTITUTIONAL_DEVELOPMENT",
  "RESEARCH_POLICY",
] as const;

export const APPLICATION_TYPES = ["ADMISSION", "SCHOLARSHIP"] as const;

export const APPLICATION_STATUSES = [
  "SUBMITTED",
  "UNDER_REVIEW",
  "INCOMPLETE",
  "VERIFIED",
  "RECOMMENDED",
  "APPROVED",
  "REJECTED",
  "WITHDRAWN",
] as const;

export const DOCUMENT_KINDS = [
  "PHOTO",
  "IDENTITY",
  "RESULT_CARD",
  "INCOME_PROOF",
  "OTHER",
] as const;

export const AWARD_STATUSES = ["ACTIVE", "ON_HOLD", "ENDED"] as const;

export const AWARD_PERIODS = ["MONTHLY", "PER_TERM", "ANNUAL"] as const;

export const CONTENT_STATUSES = ["DRAFT", "PUBLISHED", "ARCHIVED"] as const;

export const VACANCY_STATUSES = ["DRAFT", "PUBLISHED", "CLOSED"] as const;

export const EMPLOYMENT_TYPES = [
  "FULL_TIME",
  "PART_TIME",
  "CONTRACT",
  "INTERNSHIP",
  "VOLUNTEER",
] as const;

export const JOB_APPLICATION_STATUSES = [
  "RECEIVED",
  "SHORTLISTED",
  "INTERVIEW",
  "SELECTED",
  "REJECTED",
  "ON_HOLD",
] as const;

export const INSTITUTION_TYPES = [
  "SCHOOL",
  "COLLEGE",
  "TRAINING_CENTER",
  "SKILLS_CENTER",
  "OTHER",
] as const;

export const INSTITUTION_STATUSES = ["PROPOSED", "ACTIVE", "SUSPENDED", "CLOSED"] as const;

export const AGREEMENT_STATUSES = ["DRAFT", "UNDER_LEGAL_REVIEW", "APPROVED", "EXPIRED"] as const;

export const PROGRAM_CATEGORIES = ["EDUCATION", "VOCATIONAL", "SKILLS"] as const;

export const PUBLICATION_TYPES = [
  "RESEARCH_REPORT",
  "POLICY_PAPER",
  "FEASIBILITY_STUDY",
  "SURVEY",
  "NEEDS_ASSESSMENT",
  "BRIEF",
] as const;

export const NEWS_TYPES = ["NEWS", "EVENT"] as const;

export const MESSAGE_SUBJECTS = [
  "GENERAL",
  "ADMISSIONS",
  "SCHOLARSHIPS",
  "CAREERS",
  "PARTNERSHIPS",
  "OTHER",
] as const;

export const MESSAGE_STATUSES = ["NEW", "READ", "REPLIED", "ARCHIVED"] as const;

export const DIRECTIVE_PRIORITIES = ["LOW", "NORMAL", "HIGH", "URGENT"] as const;

export const ASSIGNMENT_STATUSES = [
  "PENDING_ACKNOWLEDGEMENT",
  "ACKNOWLEDGED",
  "IN_PROGRESS",
  "COMPLETED",
  "CLARIFICATION_REQUESTED",
] as const;

export const CLARIFICATION_REASONS = [
  "LAW",
  "CONSTITUTIONAL_DOCUMENTS",
  "BOARD_RESOLUTION",
  "DONOR_RESTRICTION",
  "OPERATIONAL_IMPOSSIBILITY",
] as const;

export const GENDERS = ["MALE", "FEMALE", "OTHER"] as const;

export const FILE_ACCESS_LEVELS = ["PUBLIC", "PRIVATE"] as const;

export const FILE_PURPOSES = [
  "APPLICATION_DOCUMENT",
  "CV",
  "PUBLICATION_PDF",
  "IMAGE",
  "AGREEMENT",
] as const;
