import type { Metadata } from "next";

import { PageHeader } from "@/components/portal/page-header";
import { ChangePasswordForm } from "@/features/profile/change-password-form";
import { ProfileForm } from "@/features/profile/profile-form";
import { SessionsList } from "@/features/profile/sessions-list";
import { requireSession } from "@/server/auth/session";

export const metadata: Metadata = { title: "Profile" };

export default async function ProfilePage() {
  const staff = await requireSession();
  return (
    <>
      <PageHeader title="Profile" description="Your name, password and signed-in devices." />
      <div className="max-w-2xl space-y-6">
        <ProfileForm name={staff.name} email={staff.email} />
        <ChangePasswordForm />
        <SessionsList />
      </div>
    </>
  );
}
