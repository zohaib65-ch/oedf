import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";

import { DetailSkeleton } from "@/components/shared/content-skeleton";
import { InstitutionDetail } from "@/features/institutions/institution-detail";
import { pageMetadata } from "@/lib/seo";
import { getInstitution } from "@/server/services/institution.service";

export async function generateMetadata({
  params,
}: PageProps<"/institutions/[slug]">): Promise<Metadata> {
  await connection();
  const { slug } = await params;
  const d = await getInstitution(slug);
  if (!d) {
    return { title: "Institution not found", robots: { index: false } };
  }
  return pageMetadata({
    title: d.name,
    description: d.description || `${d.name} in ${d.city}.`,
    path: `/institutions/${slug}`,
    type: "website",
  });
}

export default function InstitutionDetailPage({ params }: PageProps<"/institutions/[slug]">) {
  return (
    <Suspense fallback={<DetailSkeleton />}>
      <InstitutionDetail params={params} />
    </Suspense>
  );
}
