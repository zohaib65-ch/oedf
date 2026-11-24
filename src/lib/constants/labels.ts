import type {
  APPLICATION_STATUSES,
  APPLICATION_TYPES,
  AWARD_PERIODS,
  AWARD_STATUSES,
  DOCUMENT_KINDS,
  EMPLOYMENT_TYPES,
  GENDERS,
  INSTITUTION_TYPES,
  JOB_APPLICATION_STATUSES,
  MESSAGE_SUBJECTS,
  NEWS_TYPES,
  PROGRAM_CATEGORIES,
  PUBLICATION_TYPES,
  ROLES,
  VACANCY_STATUSES,
} from "@/lib/constants/enums";

const ROLE_LABELS = {
  SUPER_ADMIN: "Super Admin",
  CEO_OFFICE: "CEO Office",
  DIRECTOR: "Director",
  STAFF: "Staff",
} satisfies Record<(typeof ROLES)[number], string>;

/** The readable name of a staff role. Better Auth gives the role as a plain string. */
export function getRoleLabel(role: string | null | undefined): string {
  return Object.entries(ROLE_LABELS).find(([key]) => key === role)?.[1] ?? ROLE_LABELS.STAFF;
}

/** Public labels for the category-like enums, defined once so cards, filters and metadata agree. */
export const PROGRAM_CATEGORY_LABELS = {
  EDUCATION: "Education",
  VOCATIONAL: "Vocational",
  SKILLS: "Skills",
} satisfies Record<(typeof PROGRAM_CATEGORIES)[number], string>;

export const INSTITUTION_TYPE_LABELS = {
  SCHOOL: "School",
  COLLEGE: "College",
  TRAINING_CENTER: "Training center",
  SKILLS_CENTER: "Skills center",
  OTHER: "Other",
} satisfies Record<(typeof INSTITUTION_TYPES)[number], string>;

export const EMPLOYMENT_TYPE_LABELS = {
  FULL_TIME: "Full time",
  PART_TIME: "Part time",
  CONTRACT: "Contract",
  INTERNSHIP: "Internship",
  VOLUNTEER: "Volunteer",
} satisfies Record<(typeof EMPLOYMENT_TYPES)[number], string>;

export const PUBLICATION_TYPE_LABELS = {
  RESEARCH_REPORT: "Research report",
  POLICY_PAPER: "Policy paper",
  FEASIBILITY_STUDY: "Feasibility study",
  SURVEY: "Survey",
  NEEDS_ASSESSMENT: "Needs assessment",
  BRIEF: "Brief",
} satisfies Record<(typeof PUBLICATION_TYPES)[number], string>;

export const NEWS_TYPE_LABELS = {
  NEWS: "News",
  EVENT: "Event",
} satisfies Record<(typeof NEWS_TYPES)[number], string>;

export const MESSAGE_SUBJECT_LABELS = {
  GENERAL: "General",
  ADMISSIONS: "Admissions",
  SCHOLARSHIPS: "Scholarships",
  CAREERS: "Careers",
  PARTNERSHIPS: "Partnerships",
  OTHER: "Other",
} satisfies Record<(typeof MESSAGE_SUBJECTS)[number], string>;

export const DOCUMENT_KIND_LABELS = {
  PHOTO: "Photograph",
  IDENTITY: "CNIC or B-Form copy",
  RESULT_CARD: "Latest result card",
  INCOME_PROOF: "Proof of income",
  OTHER: "Other document",
} satisfies Record<(typeof DOCUMENT_KINDS)[number], string>;

export const GENDER_LABELS = {
  MALE: "Male",
  FEMALE: "Female",
  OTHER: "Other",
} satisfies Record<(typeof GENDERS)[number], string>;

/** The roles as `{ value, label }` pairs, for selects and filters. */
export const ROLE_OPTIONS = toOptions(ROLE_LABELS);

/** Status names for staff. The public status page uses its own gentler wording. */
export const APPLICATION_STATUS_LABELS = {
  SUBMITTED: "Submitted",
  UNDER_REVIEW: "Under review",
  INCOMPLETE: "Incomplete",
  VERIFIED: "Verified",
  RECOMMENDED: "Recommended",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  WITHDRAWN: "Withdrawn",
} satisfies Record<(typeof APPLICATION_STATUSES)[number], string>;

export const APPLICATION_TYPE_LABELS = {
  ADMISSION: "Admission",
  SCHOLARSHIP: "Scholarship",
} satisfies Record<(typeof APPLICATION_TYPES)[number], string>;

export const AWARD_STATUS_LABELS = {
  ACTIVE: "Active",
  ON_HOLD: "On hold",
  ENDED: "Ended",
} satisfies Record<(typeof AWARD_STATUSES)[number], string>;

export const AWARD_PERIOD_LABELS = {
  MONTHLY: "Monthly",
  PER_TERM: "Per term",
  ANNUAL: "Annual",
} satisfies Record<(typeof AWARD_PERIODS)[number], string>;

export const VACANCY_STATUS_LABELS = {
  DRAFT: "Draft",
  PUBLISHED: "Published",
  CLOSED: "Closed",
} satisfies Record<(typeof VACANCY_STATUSES)[number], string>;

export const JOB_APPLICATION_STATUS_LABELS = {
  RECEIVED: "Received",
  SHORTLISTED: "Shortlisted",
  INTERVIEW: "Interview",
  SELECTED: "Selected",
  REJECTED: "Rejected",
  ON_HOLD: "On hold",
} satisfies Record<(typeof JOB_APPLICATION_STATUSES)[number], string>;

/** `{ value, label }` pairs for a select, in the order the labels are written. */
export function toOptions(labels: Record<string, string>): { value: string; label: string }[] {
  return Object.entries(labels).map(([value, label]) => ({ value, label }));
}
