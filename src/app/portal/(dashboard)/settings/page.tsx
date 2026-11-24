import type { Metadata } from "next";

import { ForbiddenView } from "@/components/portal/forbidden-view";
import { PageHeader } from "@/components/portal/page-header";
import { OfficesForm } from "@/features/settings/offices-form";
import { SettingsForm } from "@/features/settings/settings-form";
import { checkPagePermission } from "@/server/auth/session";
import { getDepartmentsForStaff, getSiteSettings } from "@/server/services/settings.service";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const access = await checkPagePermission("settings:read");
  if (!access.isAllowed) {
    return <ForbiddenView />;
  }
  const [settings, offices] = await Promise.all([getSiteSettings(), getDepartmentsForStaff()]);
  return (
    <>
      <PageHeader
        title="Settings"
        description="Site-wide details, the intake switches and each office's notification email."
      />
      <div className="max-w-3xl space-y-6">
        <SettingsForm settings={settings} />
        <OfficesForm offices={offices} />
      </div>
    </>
  );
}
