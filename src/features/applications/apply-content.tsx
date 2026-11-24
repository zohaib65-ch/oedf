import { FileX2Icon } from "lucide-react";
import { connection } from "next/server";

import { CtaButton } from "@/components/shared/cta-button";
import { EmptyState } from "@/components/shared/empty-state";
import { publicEnv } from "@/env";
import { ApplicationForm } from "@/features/applications/application-form";
import { getApplicationPrograms } from "@/server/services/program.service";
import { getPublicSiteSettings } from "@/server/services/site-settings.service";

interface ApplyContentProps {
  type: "ADMISSION" | "SCHOLARSHIP";
}

/** The application form, or a note that applications are closed (the switch is in portal Settings). */
export async function ApplyContent({ type }: ApplyContentProps) {
  await connection();
  const settings = await getPublicSiteSettings();
  const isOpen = type === "ADMISSION" ? settings?.admissionsOpen : settings?.scholarshipsOpen;

  if (!isOpen) {
    return (
      <EmptyState
        icon={FileX2Icon}
        title={
          type === "ADMISSION"
            ? "Admissions are not open right now"
            : "Scholarship applications are not open right now"
        }
        description="Please check back soon, or contact us if you have a question."
      >
        <CtaButton href="/contact" variant="gold">
          Contact us
        </CtaButton>
      </EmptyState>
    );
  }

  const programs = await getApplicationPrograms();
  return (
    <div className="rounded-xl border border-border bg-white p-6 shadow-card md:p-10">
      <ApplicationForm
        type={type}
        programs={programs}
        turnstileSiteKey={publicEnv.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
      />
    </div>
  );
}
