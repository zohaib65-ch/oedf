import { FileTextIcon } from "lucide-react";

import { PrivateFileLink } from "@/components/portal/private-file-link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DOCUMENT_KIND_LABELS } from "@/lib/constants/labels";
import { formatBytes } from "@/lib/format";
import type { ApplicationDocumentRecord } from "@/server/repositories/application-review.repository";

/**
 * The applicant's documents. Each opens in a new tab through a link that works for five minutes,
 * and every opening is written to the audit log.
 */
export function ApplicationDocuments({ documents }: { documents: ApplicationDocumentRecord[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Documents</CardTitle>
        <CardDescription>Each opening is recorded in the audit log.</CardDescription>
      </CardHeader>
      <CardContent>
        {documents.length === 0 ? (
          <p className="text-muted-foreground">No documents were uploaded.</p>
        ) : (
          <ul className="divide-y">
            {documents.map((document) => (
              <li
                key={document.fileId}
                className="flex flex-wrap items-center justify-between gap-3 py-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <FileTextIcon
                    className="size-5 shrink-0 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <div className="min-w-0">
                    <p className="font-medium">{DOCUMENT_KIND_LABELS[document.kind]}</p>
                    <p className="truncate text-sm text-muted-foreground">
                      {document.originalName}, {document.format.toUpperCase()},{" "}
                      {formatBytes(document.bytes)}
                    </p>
                  </div>
                </div>
                <PrivateFileLink
                  fileId={document.fileId}
                  name={DOCUMENT_KIND_LABELS[document.kind]}
                />
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
