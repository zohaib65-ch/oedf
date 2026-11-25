import { UsersRoundIcon } from "lucide-react";
import type { Metadata } from "next";

import { ForbiddenView } from "@/components/portal/forbidden-view";
import { PageHeader } from "@/components/portal/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { TeamList } from "@/features/team-management/team-list";
import { TeamMemberDialog } from "@/features/team-management/team-member-dialog";
import { checkPagePermission } from "@/server/auth/session";
import { toPublicImage } from "@/server/services/image.service";
import { getTeamMembersForStaff } from "@/server/services/team-management.service";

export const metadata: Metadata = { title: "Team" };

export default async function TeamPage() {
  const access = await checkPagePermission("team:manage");
  if (!access.isAllowed) {
    return <ForbiddenView />;
  }
  const members = (await getTeamMembersForStaff()).map((member) => ({
    id: member.id,
    name: member.name,
    position: member.position,
    bio: member.bio,
    isPublished: member.isPublished,
    image: member.image
      ? {
          publicId: member.image.publicId,
          resourceType: "image" as const,
          originalName: "Current photo",
        }
      : undefined,
    imageAlt: member.image?.alt ?? "",
    photo: toPublicImage(member.image, 480),
  }));

  return (
    <>
      <PageHeader
        title="Team"
        description="The people on the public Team page (/team), in the order shown here. Hidden ones are kept but not shown."
        actions={<TeamMemberDialog />}
      />
      {members.length === 0 ? (
        <EmptyState
          icon={UsersRoundIcon}
          title="No team members yet"
          description="Add the first person; published team members appear on the public Team page."
        />
      ) : (
        <Card>
          <CardContent>
            <TeamList members={members} />
          </CardContent>
        </Card>
      )}
    </>
  );
}
