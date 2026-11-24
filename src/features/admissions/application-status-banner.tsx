import { connection } from "next/server";

import { Container } from "@/components/shared/container";
import { getPublicSiteSettings } from "@/server/services/site-settings.service";

/** Says whether applications are open, using the switch in portal Settings. */
export async function ApplicationStatusBanner({ kind }: { kind: "admissions" | "scholarships" }) {
  await connection();
  const settings = await getPublicSiteSettings();
  const isOpen = kind === "admissions" ? settings?.admissionsOpen : settings?.scholarshipsOpen;
  const noun = kind === "admissions" ? "Admissions" : "Scholarship applications";

  return (
    <Container className="pt-10">
      <p
        role="status"
        className="rounded-lg border border-border bg-white px-5 py-4 text-center font-semibold text-foreground shadow-card"
      >
        {isOpen ? `${noun} are open.` : `${noun} are not open right now.`}
      </p>
    </Container>
  );
}
