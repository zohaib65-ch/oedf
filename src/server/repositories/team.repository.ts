import "server-only";

import { connectDb } from "@/server/db/connection";
import { TeamMemberModel } from "@/server/db/models/team-member.model";
import type { StoredImage } from "@/server/services/image.service";

export interface TeamMemberRecord {
  id: string;
  name: string;
  position: string;
  bio: string;
  image: StoredImage | null;
}

export interface StaffTeamMemberRecord extends TeamMemberRecord {
  order: number;
  isPublished: boolean;
  updatedAt: string;
}

interface TeamMemberRow {
  _id: { toString(): string };
  name: string;
  position: string;
  bio: string;
  image?: StoredImage | null;
  order: number;
  isPublished: boolean;
  updatedAt: Date;
}

function toImage(image: StoredImage | null | undefined): StoredImage | null {
  return image
    ? { publicId: image.publicId, width: image.width, height: image.height, alt: image.alt }
    : null;
}

function toStaffRecord(row: TeamMemberRow): StaffTeamMemberRecord {
  return {
    id: row._id.toString(),
    name: row.name,
    position: row.position,
    bio: row.bio,
    image: toImage(row.image),
    order: row.order,
    isPublished: row.isPublished,
    updatedAt: row.updatedAt.toISOString(),
  };
}

/** Published team members in the order set in the portal. */
export async function listPublishedTeamMembers(): Promise<TeamMemberRecord[]> {
  await connectDb();
  const rows = await TeamMemberModel.find(
    { isPublished: true },
    { name: 1, position: 1, bio: 1, image: 1 },
  )
    .sort({ order: 1, _id: 1 })
    .lean();
  return rows.map((row) => ({
    id: row._id.toString(),
    name: row.name,
    position: row.position,
    bio: row.bio,
    image: toImage(row.image),
  }));
}

/** Every team member, published or not, in order. */
export async function listTeamMembersForStaff(): Promise<StaffTeamMemberRecord[]> {
  await connectDb();
  const rows = await TeamMemberModel.find({}).sort({ order: 1, _id: 1 }).lean();
  return rows.map(toStaffRecord);
}

export async function findTeamMemberForStaff(id: string): Promise<StaffTeamMemberRecord | null> {
  await connectDb();
  const row = await TeamMemberModel.findById(id).lean();
  return row ? toStaffRecord(row) : null;
}

export interface TeamMemberFields {
  name: string;
  position: string;
  bio: string;
  isPublished: boolean;
  image: StoredImage | null;
}

/** Saves a new team member at the end of the list and returns its ID. */
export async function createTeamMember(fields: TeamMemberFields): Promise<string> {
  await connectDb();
  const last = await TeamMemberModel.findOne({}, { order: 1 }).sort({ order: -1 }).lean();
  const { image, ...rest } = fields;
  const [created] = await TeamMemberModel.insertMany([
    { ...rest, ...(image ? { image } : {}), order: last ? last.order + 1 : 0 },
  ]);
  if (!created) {
    throw new Error("The team member was not created.");
  }
  return created._id.toString();
}

/** Saves every field. Returns false when the team member is gone. */
export async function updateTeamMember(id: string, fields: TeamMemberFields): Promise<boolean> {
  await connectDb();
  const { image, ...rest } = fields;
  const result = await TeamMemberModel.updateOne(
    { _id: id },
    image ? { $set: { ...rest, image } } : { $set: rest, $unset: { image: 1 } },
  );
  return result.matchedCount === 1;
}

export async function deleteTeamMember(id: string): Promise<boolean> {
  await connectDb();
  const result = await TeamMemberModel.deleteOne({ _id: id });
  return result.deletedCount === 1;
}

/** The IDs of every team member. */
export async function listTeamMemberIds(): Promise<string[]> {
  await connectDb();
  const rows = await TeamMemberModel.find({}, { _id: 1 }).lean();
  return rows.map((row) => row._id.toString());
}

/** Numbers the team members in the given order. */
export async function saveTeamOrder(ids: readonly string[]): Promise<void> {
  await connectDb();
  await TeamMemberModel.bulkWrite(
    ids.map((id, order) => ({ updateOne: { filter: { _id: id }, update: { $set: { order } } } })),
  );
}
