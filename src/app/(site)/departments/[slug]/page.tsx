import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";

import { DetailSkeleton } from "@/components/shared/content-skeleton";
import { DepartmentDetail } from "@/features/departments/department-detail";
import { pageMetadata } from "@/lib/seo";
import { getDepartment } from "@/server/services/department.service";

export async function generateMetadata({
  params,
}: PageProps<"/departments/[slug]">): Promise<Metadata> {
  await connection();
  const { slug } = await params;
  const d = await getDepartment(slug);
  if (!d) {
    return { title: "Department not found", robots: { index: false } };
  }
  return pageMetadata({
    title: d.name,
    description: d.purpose,
    path: `/departments/${slug}`,
    hasOwnImage: true,
    type: "website",
  });
}

export default function DepartmentDetailPage({ params }: PageProps<"/departments/[slug]">) {
  return (
    <Suspense fallback={<DetailSkeleton />}>
      <DepartmentDetail params={params} />
    </Suspense>
  );
}
