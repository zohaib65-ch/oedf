import "server-only";
import { cacheLife, cacheTag } from "next/cache";

import { CACHE_TAGS } from "@/lib/constants/cache-tags";
import { listPublishedTeamMembers } from "@/server/repositories/team.repository";
import { toPublicImage, type PublicImage } from "@/server/services/image.service";

export interface PublicTeamMember {
  id: string;
  name: string;
  position: string;
  bio: string;
  photo: PublicImage | null;
}

/** The published team in the order set in the portal, with sized photo links. */
export async function getTeam(): Promise<PublicTeamMember[]> {
  "use cache";
  cacheTag(CACHE_TAGS.team);
  cacheLife("hours");
  const members = await listPublishedTeamMembers();
  return members.map(({ image, ...member }) => ({ ...member, photo: toPublicImage(image, 480) }));
}
