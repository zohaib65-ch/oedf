"use client";

import { ArrowDownIcon, ArrowUpIcon, Trash2Icon, UserRoundIcon } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { ConfirmButton } from "@/components/portal/confirm-button";
import { StatusBadge } from "@/components/portal/status-badge";
import { Button } from "@/components/ui/button";
import {
  TeamMemberDialog,
  type TeamMemberItem,
} from "@/features/team-management/team-member-dialog";
import { apiDelete, apiPatch } from "@/lib/api/client";
import { toastApiError, useApiAction } from "@/lib/api/use-api-action";

/** The team in its public order, with buttons to move, edit and delete each person. */
export function TeamList({ members }: { members: readonly TeamMemberItem[] }) {
  const router = useRouter();
  const { run, isPending } = useApiAction(async (ids: string[]) => {
    await apiPatch("/team-members/order", { ids });
  });

  const move = (index: number, offset: -1 | 1) => {
    const ids = members.map((member) => member.id);
    const [moved] = ids.splice(index, 1);
    if (!moved) {
      return;
    }
    ids.splice(index + offset, 0, moved);
    run(ids)
      .then(() => {
        toast.success("Order saved.");
        router.refresh();
      })
      .catch(toastApiError);
  };

  return (
    <ol className="divide-y divide-border">
      {members.map((member, index) => (
        <li key={member.id} className="flex flex-wrap items-center justify-between gap-4 py-4">
          <div className="flex min-w-0 flex-1 items-center gap-4">
            {member.photo ? (
              <Image
                src={member.photo.url}
                alt=""
                width={48}
                height={48}
                className="size-12 shrink-0 rounded-full object-cover"
              />
            ) : (
              <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-gold/10 text-gold-text">
                <UserRoundIcon className="size-5" aria-hidden="true" />
              </span>
            )}
            <div className="min-w-0">
              <p className="font-semibold break-words">{member.name}</p>
              <p className="text-sm text-muted-foreground">{member.position}</p>
              <StatusBadge
                label={member.isPublished ? "Published" : "Hidden"}
                tone={member.isPublished ? "positive" : "closed"}
              />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={index === 0 || isPending}
              onClick={() => {
                move(index, -1);
              }}
            >
              <ArrowUpIcon aria-hidden="true" />
              <span className="sr-only">Move {member.name} up</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={index === members.length - 1 || isPending}
              onClick={() => {
                move(index, 1);
              }}
            >
              <ArrowDownIcon aria-hidden="true" />
              <span className="sr-only">Move {member.name} down</span>
            </Button>
            <TeamMemberDialog member={member} />
            <ConfirmButton
              label={`Delete ${member.name}`}
              title={`Delete ${member.name}?`}
              description="They are removed from the Team page, with their photo, for good. This is recorded in the audit log."
              confirmLabel="Delete"
              variant="destructive"
              icon={Trash2Icon}
              onConfirm={async () => {
                await apiDelete(`/team-members/${member.id}`);
                toast.success("Team member deleted.");
                router.refresh();
              }}
            />
          </div>
        </li>
      ))}
    </ol>
  );
}
