import { DownloadIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * Downloads the list as it is filtered and sorted now, as a CSV file. A plain link, so the browser
 * handles the download; the server checks the permission and records the export.
 */
export function ExportCsvButton({ href }: { href: string }) {
  return (
    <Button asChild variant="outline">
      <a href={href} download>
        <DownloadIcon aria-hidden="true" />
        Export CSV
      </a>
    </Button>
  );
}
