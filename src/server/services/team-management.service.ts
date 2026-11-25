import "server-only";
import { revalidateTag } from "next/cache";

import { CACHE_TAGS } from "@/lib/constants/cache-tags";
import { hasPermission } from "@/lib/constants/permissions";
import type { TeamMemberFormInput, TeamOrderInput } from "@/lib/validations/team";
import type { StaffContext } from "@/server/auth/api-session";
import { AppError } from "@/server/http/errors";
import {
  createTeamMember as createTeamMemberRecord,
  deleteTeamMember as deleteTeamMemberRecord,
  findTeamMemberForStaff,
  listTeamMemberIds,
  listTeamMembersForStaff,
  saveTeamOrder,
  updateTeamMember as updateTeamMemberRecord,
  type StaffTeamMemberRecord,
  type TeamMemberFields,
} from "@/server/repositories/team.repository";
import { recordAudit } from "@/server/services/audit-log.service";
import { resolveImage, settleImage } from "@/server/services/image.service";

const ENTITY_TYPE = "TeamMember";
const NOT_FOUND_MESSAGE = "This team member could not be found.";
// Route handlers cannot use `updateTag`, so the public page is expired with `revalidateTag`.
const EXPIRE_NOW = { expire: 0 } as const;

const isObjectId = (id: string) => /^[0-9a-f]{24}$/.test(id);

function assertMayManage(staff: StaffContext): void {
  if (!hasPermission(staff, "team:manage")) {
    throw new AppError("FORBIDDEN", "Only a Super Admin manages the team.");
  }
}

function expirePublicPage(): void {
  revalidateTag(CACHE_TAGS.team, EXPIRE_NOW);
}

export function getTeamMembersForStaff(): Promise<StaffTeamMemberRecord[]> {
  return listTeamMembersForStaff();
}

async function getTeamMember(id: string): Promise<StaffTeamMemberRecord> {
  const member = isObjectId(id) ? await findTeamMemberForStaff(id) : null;
  if (!member) {
    throw new AppError("NOT_FOUND", NOT_FOUND_MESSAGE);
  }
  return member;
}

async function toFields(
  input: TeamMemberFormInput,
  current: StaffTeamMemberRecord | null,
): Promise<TeamMemberFields> {
  const { image, imageAlt, ...rest } = input;
  return { ...rest, image: await resolveImage(current?.image ?? null, { image, imageAlt }) };
}

/** Adds a team member at the end of the list. */
export async function createTeamMember(
  staff: StaffContext,
  input: TeamMemberFormInput,
): Promise<StaffTeamMemberRecord> {
  assertMayManage(staff);
  const fields = await toFields(input, null);
  const id = await createTeamMemberRecord(fields);
  await settleImage(null, fields.image);
  await recordAudit(staff, {
    action: "team_member.created",
    entityType: ENTITY_TYPE,
    entityId: id,
    metadata: { name: input.name },
  });
  if (input.isPublished) {
    expirePublicPage();
  }
  return getTeamMember(id);
}

function changedFields(member: StaffTeamMemberRecord, fields: TeamMemberFields): string[] {
  const imageKey = (image: TeamMemberFields["image"]) =>
    image ? `${image.publicId}|${image.alt}` : "";
  const keys = ["name", "position", "bio", "isPublished"] as const;
  return [
    ...keys.filter((key) => member[key] !== fields[key]),
    ...(imageKey(member.image) === imageKey(fields.image) ? [] : ["image"]),
  ];
}

export async function updateTeamMember(
  staff: StaffContext,
  id: string,
  input: TeamMemberFormInput,
): Promise<StaffTeamMemberRecord> {
  assertMayManage(staff);
  const member = await getTeamMember(id);
  const fields = await toFields(input, member);
  const changed = changedFields(member, fields);
  if (changed.length === 0) {
    return member;
  }
  if (!(await updateTeamMemberRecord(id, fields))) {
    throw new AppError("NOT_FOUND", NOT_FOUND_MESSAGE);
  }
  await settleImage(member.image, fields.image);
  await recordAudit(staff, {
    action: "team_member.updated",
    entityType: ENTITY_TYPE,
    entityId: id,
    metadata: { fields: changed.join(", ") },
  });
  if (member.isPublished || fields.isPublished) {
    expirePublicPage();
  }
  return getTeamMember(id);
}

/** Deletes a team member and their photo, after a confirmation. Recorded in the audit log. */
export async function deleteTeamMember(staff: StaffContext, id: string): Promise<void> {
  assertMayManage(staff);
  const member = await getTeamMember(id);
  if (!(await deleteTeamMemberRecord(id))) {
    throw new AppError("NOT_FOUND", NOT_FOUND_MESSAGE);
  }
  await settleImage(member.image, null);
  await recordAudit(staff, {
    action: "team_member.deleted",
    entityType: ENTITY_TYPE,
    entityId: id,
    metadata: { name: member.name },
  });
  if (member.isPublished) {
    expirePublicPage();
  }
}

/** Saves the new order. The list must name every team member exactly once. */
export async function reorderTeam(staff: StaffContext, input: TeamOrderInput): Promise<void> {
  assertMayManage(staff);
  const current = await listTeamMemberIds();
  const given = new Set(input.ids);
  if (
    given.size !== input.ids.length ||
    given.size !== current.length ||
    current.some((id) => !given.has(id))
  ) {
    throw new AppError("CONFLICT", "The team changed. Reload the page and try again.");
  }
  await saveTeamOrder(input.ids);
  await recordAudit(staff, {
    action: "team_member.reordered",
    entityType: ENTITY_TYPE,
    entityId: input.ids[0] ?? "",
    metadata: { count: String(input.ids.length) },
  });
  expirePublicPage();
}
