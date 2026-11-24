import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";

import { DetailSkeleton } from "@/components/shared/content-skeleton";
import { PublicationDetail } from "@/features/research/publication-detail";
import { pageMetadata } from "@/lib/seo";
import { getPublication } from "@/server/services/publication.service";

export async function generateMetadata({
  params,
}: PageProps<"/research/[slug]">): Promise<Metadata> {
  await connection();
  const { slug } = await params;
  const d = await getPublication(slug);
  if (!d) {
    return { title: "Publication not found", robots: { index: false } };
  }
  return pageMetadata({
    title: d.title,
    description: d.summary,
    path: `/research/${slug}`,
    type: "website",
  });
}

export default function PublicationDetailPage({ params }: PageProps<"/research/[slug]">) {
  return (
    <Suspense fallback={<DetailSkeleton />}>
      <PublicationDetail params={params} />
    </Suspense>
  );
}
