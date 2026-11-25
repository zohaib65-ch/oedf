import type { Metadata } from "next";
import Link from "next/link";

import { DetailList } from "@/components/portal/detail-list";
import { ForbiddenView } from "@/components/portal/forbidden-view";
import { PageHeader } from "@/components/portal/page-header";
import { StatusBadge } from "@/components/portal/status-badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DeleteNewsButton } from "@/features/news-management/delete-news-button";
import { NewsForm } from "@/features/news-management/news-form";
import { CONTENT_STATUS_LABELS, NEWS_TYPE_LABELS } from "@/lib/constants/labels";
import { hasPermission } from "@/lib/constants/permissions";
import { formatDateTime } from "@/lib/format";
import { checkPagePermission } from "@/server/auth/session";
import { orNotFound } from "@/server/http/or-not-found";
import { toPublicImage } from "@/server/services/image.service";
import { getNewsPostForStaff } from "@/server/services/news-management.service";

export const metadata: Metadata = { title: "Post" };

const TONE = { DRAFT: "progress", PUBLISHED: "positive", ARCHIVED: "closed" } as const;

export default async function NewsPostPage({ params }: PageProps<"/portal/news/[id]">) {
  const access = await checkPagePermission("news:manage");
  if (!access.isAllowed) {
    return <ForbiddenView />;
  }
  const { id } = await params;
  const post = await orNotFound(getNewsPostForStaff(id));

  return (
    <>
      <PageHeader
        title={post.title}
        description={`${NEWS_TYPE_LABELS[post.type]} by ${post.authorName}.`}
        actions={
          <StatusBadge label={CONTENT_STATUS_LABELS[post.status]} tone={TONE[post.status]} />
        }
      />
      {hasPermission(access.staff, "content:delete") ? (
        <section aria-label="Post actions" className="flex flex-wrap gap-2">
          <DeleteNewsButton postId={post.id} title={post.title} />
        </section>
      ) : null}
      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Edit post</CardTitle>
            <CardDescription>
              {post.status === "PUBLISHED"
                ? "Changes appear on the public site at once."
                : "Visitors cannot see this post."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <NewsForm
              postId={post.id}
              currentImage={toPublicImage(post.cover, 480)}
              defaultValues={{
                title: post.title,
                type: post.type,
                excerpt: post.excerpt,
                body: post.body,
                eventDate: post.eventDate ?? "",
                eventStartTime: post.eventStartTime,
                venue: post.venue,
                status: post.status,
                publishedOn: post.publishedAt ? post.publishedAt.slice(0, 10) : "",
                seoTitle: post.seoTitle,
                seoDescription: post.seoDescription,
                image: post.cover
                  ? {
                      publicId: post.cover.publicId,
                      resourceType: "image",
                      originalName: "Current cover",
                    }
                  : undefined,
                imageAlt: post.cover?.alt ?? "",
              }}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>At a glance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <DetailList
              columns={1}
              items={[
                {
                  label: "Published",
                  value: post.publishedAt ? formatDateTime(post.publishedAt) : "Not yet",
                },
                { label: "Created", value: formatDateTime(post.createdAt) },
                { label: "Last changed", value: formatDateTime(post.updatedAt) },
              ]}
            />
            {post.status === "PUBLISHED" ? (
              <Link
                href={`/news/${post.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-navy underline underline-offset-2"
              >
                View on the public site<span className="sr-only"> (opens in a new tab)</span>
              </Link>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
