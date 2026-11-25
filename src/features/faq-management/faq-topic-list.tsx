"use client";

import { ArrowDownIcon, ArrowUpIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { ConfirmButton } from "@/components/portal/confirm-button";
import { StatusBadge } from "@/components/portal/status-badge";
import { Button } from "@/components/ui/button";
import { FaqDialog } from "@/features/faq-management/faq-dialog";
import { apiDelete, apiPatch } from "@/lib/api/client";
import { toastApiError, useApiAction } from "@/lib/api/use-api-action";

interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  isPublished: boolean;
}

interface FaqTopicListProps {
  category: string;
  faqs: readonly FaqItem[];
  topics: readonly string[];
  canDelete: boolean;
}

/** One topic's questions in their public order, with buttons to move, edit and delete each. */
export function FaqTopicList({ category, faqs, topics, canDelete }: FaqTopicListProps) {
  const router = useRouter();
  const { run, isPending } = useApiAction(async (ids: string[]) => {
    await apiPatch("/faqs/order", { category, ids });
  });

  const move = (index: number, offset: -1 | 1) => {
    const ids = faqs.map((faq) => faq.id);
    const [moved] = ids.splice(index, 1);
    if (!moved) {
      return;
    }
    ids.splice(index + offset, 0, moved);
    run(ids)
      .then(() => {
        toast.success("Order saved.");
        router.refresh();
      })
      .catch(toastApiError);
  };

  return (
    <ol className="divide-y divide-border">
      {faqs.map((faq, index) => (
        <li key={faq.id} className="flex flex-wrap items-start justify-between gap-3 py-3">
          <div className="min-w-0 flex-1">
            <p className="font-medium break-words">{faq.question}</p>
            <StatusBadge
              label={faq.isPublished ? "Published" : "Hidden"}
              tone={faq.isPublished ? "positive" : "closed"}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={index === 0 || isPending}
              onClick={() => {
                move(index, -1);
              }}
            >
              <ArrowUpIcon aria-hidden="true" />
              <span className="sr-only">Move “{faq.question}” up</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={index === faqs.length - 1 || isPending}
              onClick={() => {
                move(index, 1);
              }}
            >
              <ArrowDownIcon aria-hidden="true" />
              <span className="sr-only">Move “{faq.question}” down</span>
            </Button>
            <FaqDialog faq={faq} topics={topics} />
            {canDelete ? (
              <ConfirmButton
                label="Delete"
                title={`Delete “${faq.question}”?`}
                description="The question is removed for good. This is recorded in the audit log."
                variant="destructive"
                onConfirm={async () => {
                  await apiDelete(`/faqs/${faq.id}`);
                  toast.success("Question deleted.");
                  router.refresh();
                }}
              />
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  );
}
