"use client";

import Link from "next/link";

import {
  DataTable,
  type DataTableColumn,
  type DataTableSorting,
} from "@/components/portal/data-table";
import { StatusBadge } from "@/components/portal/status-badge";
import { CONTENT_STATUS_LABELS, NEWS_TYPE_LABELS } from "@/lib/constants/labels";
import { formatDateTime, formatDay } from "@/lib/format";
import type { StaffNewsListItem } from "@/server/repositories/news-management.repository";

const TONE = { DRAFT: "progress", PUBLISHED: "positive", ARCHIVED: "closed" } as const;

const columns: DataTableColumn<StaffNewsListItem>[] = [
  {
    id: "title",
    header: "Title",
    sortKey: "title",
    cell: (post) => (
      <Link
        href={`/portal/news/${post.id}`}
        className="font-semibold text-navy underline underline-offset-2"
      >
        {post.title}
      </Link>
    ),
  },
  { id: "type", header: "Type", cell: (post) => NEWS_TYPE_LABELS[post.type] },
  {
    id: "status",
    header: "Status",
    cell: (post) => (
      <StatusBadge label={CONTENT_STATUS_LABELS[post.status]} tone={TONE[post.status]} />
    ),
  },
  {
    id: "eventDate",
    header: "Event date",
    cell: (post) => (post.eventDate ? formatDay(post.eventDate) : ""),
  },
  {
    id: "publishedAt",
    header: "Published",
    sortKey: "publishedAt",
    cell: (post) => (post.publishedAt ? formatDateTime(post.publishedAt) : "Not yet"),
  },
  { id: "author", header: "Author", cell: (post) => post.authorName },
  {
    id: "updated",
    header: "Last changed",
    sortKey: "updatedAt",
    cell: (post) => formatDateTime(post.updatedAt),
  },
];

interface NewsTableProps {
  posts: StaffNewsListItem[];
  sorting: DataTableSorting;
}

export function NewsTable({ posts, sorting }: NewsTableProps) {
  return (
    <DataTable
      label="News and events"
      columns={columns}
      rows={posts}
      getRowId={(post) => post.id}
      sorting={sorting}
    />
  );
}
