import { UserRoundIcon, UsersRoundIcon } from "lucide-react";
import Image from "next/image";
import { connection } from "next/server";

import { ClampedText } from "@/components/shared/clamped-text";
import { EmptyState } from "@/components/shared/empty-state";
import { getTeam } from "@/server/services/team.service";

/** The published team as cards: photo (or a placeholder), name, position and a short bio. */
export async function TeamGrid() {
  await connection();
  const team = await getTeam();
  if (team.length === 0) {
    return (
      <EmptyState
        icon={UsersRoundIcon}
        title="Our team is coming soon"
        description="We are adding the people behind the foundation. Please check back shortly."
      />
    );
  }

  return (
    <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {team.map((member) => (
        <li
          key={member.id}
          className="flex flex-col overflow-hidden rounded-xl border border-border bg-white shadow-card"
        >
          {member.photo ? (
            <Image
              src={member.photo.url}
              alt={member.photo.alt}
              width={member.photo.width}
              height={member.photo.height}
              sizes="(min-width: 1280px) 18rem, (min-width: 1024px) 30vw, (min-width: 640px) 45vw, 90vw"
              className="aspect-4/5 w-full object-cover object-top"
            />
          ) : (
            <div className="flex aspect-4/5 w-full items-center justify-center bg-navy text-gold">
              <UserRoundIcon className="size-16" aria-hidden="true" />
            </div>
          )}
          <div className="flex flex-1 flex-col border-t-4 border-gold p-6">
            <h2 className="text-lg font-bold text-foreground">{member.name}</h2>
            <p className="mt-1 text-sm font-semibold text-gold-text">{member.position}</p>
            {member.bio ? (
              <ClampedText
                text={member.bio}
                lines={4}
                className="mt-3 text-sm leading-relaxed whitespace-pre-line text-muted-foreground"
              />
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  );
}
