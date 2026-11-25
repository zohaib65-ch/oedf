import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";

import { DetailSkeleton } from "@/components/shared/content-skeleton";
import { NewsDetail } from "@/features/news/news-detail";
import { pageMetadata } from "@/lib/seo";
import { getNewsPost } from "@/server/services/news.service";

export async function generateMetadata({ params }: PageProps<"/news/[slug]">): Promise<Metadata> {
  await connection();
  const { slug } = await params;
  const d = await getNewsPost(slug);
  if (!d) {
    return { title: "Article not found", robots: { index: false } };
  }
  return pageMetadata({
    title: d.seoTitle || d.title,
    description: d.seoDescription || d.excerpt,
    path: `/news/${slug}`,
    hasOwnImage: true,
    type: "article",
  });
}

export default function NewsDetailPage({ params }: PageProps<"/news/[slug]">) {
  return (
    <Suspense fallback={<DetailSkeleton />}>
      <NewsDetail params={params} />
    </Suspense>
  );
}
