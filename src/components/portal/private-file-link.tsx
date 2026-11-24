import { ExternalLinkIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

interface PrivateFileLinkProps {
  fileId: string;
  /** What the file is, read out after "Open" by screen readers, for example "CV". */
  name: string;
}

/**
 * Opens a private file in a new tab through a link that works for five minutes. Every opening is
 * written to the audit log by the server.
 */
export function PrivateFileLink({ fileId, name }: PrivateFileLinkProps) {
  return (
    <Button asChild variant="outline" size="sm">
      <a href={`/api/v1/files/${fileId}`} target="_blank" rel="noopener noreferrer">
        Open
        <ExternalLinkIcon aria-hidden="true" />
        <span className="sr-only"> {name} (opens in a new tab)</span>
      </a>
    </Button>
  );
}
