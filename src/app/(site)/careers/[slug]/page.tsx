import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";

import { DetailSkeleton } from "@/components/shared/content-skeleton";
import { VacancyDetail } from "@/features/careers/vacancy-detail";
import { pageMetadata } from "@/lib/seo";
import { getVacancy } from "@/server/services/vacancy.service";

export async function generateMetadata({
  params,
}: PageProps<"/careers/[slug]">): Promise<Metadata> {
  await connection();
  const { slug } = await params;
  const d = await getVacancy(slug);
  if (!d) {
    return { title: "Vacancy not found", robots: { index: false } };
  }
  return pageMetadata({
    title: d.title,
    description: `${d.title} at Omar Education Development Foundation, ${d.city}.`,
    path: `/careers/${slug}`,
    hasOwnImage: true,
    type: "website",
  });
}

export default function VacancyDetailPage({ params }: PageProps<"/careers/[slug]">) {
  return (
    <Suspense fallback={<DetailSkeleton />}>
      <VacancyDetail params={params} />
    </Suspense>
  );
}
