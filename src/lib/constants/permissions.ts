import type { DEPARTMENT_CODES, ROLES } from "@/lib/constants/enums";

type Role = (typeof ROLES)[number];
type DepartmentCode = (typeof DEPARTMENT_CODES)[number];

/** Every action a staff member can be allowed to do. One list, used by the UI and the server. */
export const PERMISSIONS = [
  "dashboard:read",
  "applications:read",
  "applications:review",
  "applications:decide",
  "applications:export",
  "awards:read",
  "awards:manage",
  "vacancies:read",
  "vacancies:write",
  "vacancies:publish",
  "job-applications:read",
  "job-applications:review",
  "job-applications:export",
  "institutions:read",
  "institutions:write",
  "institutions:publish",
  "programs:read",
  "programs:write",
  "programs:publish",
  "publications:read",
  "publications:write",
  "publications:publish",
  "directives:read",
  "directives:issue",
  "directives:respond",
  "directives:update",
  "directives:resolve",
  "news:manage",
  "faqs:manage",
  "content:delete",
  "messages:read",
  "messages:manage",
  "users:manage",
  "settings:read",
  "settings:manage",
  "audit:read",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

const STAFF_PERMISSIONS = [
  "dashboard:read",
  "applications:read",
  "applications:review",
  "awards:read",
  "vacancies:read",
  "vacancies:write",
  "job-applications:read",
  "job-applications:review",
  "institutions:read",
  "institutions:write",
  "programs:read",
  "programs:write",
  "publications:read",
  "publications:write",
  "directives:read",
  "directives:update",
  "messages:read",
  "messages:manage",
] as const satisfies readonly Permission[];

const DIRECTOR_PERMISSIONS = [
  ...STAFF_PERMISSIONS,
  "applications:decide",
  "applications:export",
  "job-applications:export",
  "awards:manage",
  "vacancies:publish",
  "institutions:publish",
  "programs:publish",
  "publications:publish",
  "directives:issue",
  "directives:respond",
  "content:delete",
] as const satisfies readonly Permission[];

const CEO_OFFICE_PERMISSIONS = [
  "dashboard:read",
  "applications:read",
  "applications:decide",
  "applications:export",
  "awards:read",
  "vacancies:read",
  "job-applications:read",
  "job-applications:export",
  "institutions:read",
  "programs:read",
  "publications:read",
  "directives:read",
  "directives:respond",
  "directives:resolve",
  "news:manage",
  "faqs:manage",
  "content:delete",
  "messages:read",
  "messages:manage",
  "audit:read",
] as const satisfies readonly Permission[];

/** What each role may do. The one place access is decided. */
export const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  SUPER_ADMIN: PERMISSIONS,
  CEO_OFFICE: CEO_OFFICE_PERMISSIONS,
  DIRECTOR: DIRECTOR_PERMISSIONS,
  STAFF: STAFF_PERMISSIONS,
};

/**
 * Modules one office owns. A Director or Staff member holds these permissions only inside their own
 * office; Super Admin and the CEO Office are not tied to an office. Permissions not listed here
 * (directives, dashboard, messages) are open to every office, and the service narrows what they see.
 */
const OWNING_OFFICE: Partial<Record<string, DepartmentCode>> = {
  applications: "ADMISSIONS_SCHOLARSHIPS",
  awards: "ADMISSIONS_SCHOLARSHIPS",
  vacancies: "HR_TEACHER_MANAGEMENT",
  "job-applications": "HR_TEACHER_MANAGEMENT",
  institutions: "INSTITUTIONAL_DEVELOPMENT",
  programs: "INSTITUTIONAL_DEVELOPMENT",
  publications: "RESEARCH_POLICY",
};

const OFFICE_FREE_ROLES: ReadonlySet<Role> = new Set(["SUPER_ADMIN", "CEO_OFFICE"]);

/** Only the Research & Policy Institute issues directives. */
const DIRECTIVE_OFFICE: DepartmentCode = "RESEARCH_POLICY";

export interface PermissionSubject {
  role: Role;
  departmentCode: DepartmentCode | null;
}

export function hasPermission(subject: PermissionSubject, permission: Permission): boolean {
  if (!ROLE_PERMISSIONS[subject.role].includes(permission)) {
    return false;
  }
  if (OFFICE_FREE_ROLES.has(subject.role)) {
    return true;
  }
  if (permission === "directives:issue") {
    return subject.departmentCode === DIRECTIVE_OFFICE;
  }
  const owner = OWNING_OFFICE[permission.split(":")[0] ?? ""];
  return owner === undefined || owner === subject.departmentCode;
}
