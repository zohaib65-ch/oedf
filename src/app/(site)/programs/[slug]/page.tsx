import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";

import { DetailSkeleton } from "@/components/shared/content-skeleton";
import { ProgramDetail } from "@/features/programs/program-detail";
import { pageMetadata } from "@/lib/seo";
import { getProgram } from "@/server/services/program.service";

export async function generateMetadata({
  params,
}: PageProps<"/programs/[slug]">): Promise<Metadata> {
  await connection();
  const { slug } = await params;
  const d = await getProgram(slug);
  if (!d) {
    return { title: "Program not found", robots: { index: false } };
  }
  return pageMetadata({
    title: d.title,
    description: d.summary,
    path: `/programs/${slug}`,
    hasOwnImage: true,
    type: "website",
  });
}

export default function ProgramDetailPage({ params }: PageProps<"/programs/[slug]">) {
  return (
    <Suspense fallback={<DetailSkeleton />}>
      <ProgramDetail params={params} />
    </Suspense>
  );
}
