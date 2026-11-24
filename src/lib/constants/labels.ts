import type { ROLES } from "@/lib/constants/enums";

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
