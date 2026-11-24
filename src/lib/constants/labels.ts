import type {
  EMPLOYMENT_TYPES,
  INSTITUTION_TYPES,
  NEWS_TYPES,
  PROGRAM_CATEGORIES,
  PUBLICATION_TYPES,
  ROLES,
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
