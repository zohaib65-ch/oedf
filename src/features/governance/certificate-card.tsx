import { ExternalLinkIcon, FileTextIcon, ShieldCheckIcon } from "lucide-react";
import Image from "next/image";

import { ctaButtonVariants } from "@/components/shared/cta-button";
import { Button } from "@/components/ui/button";
import type { Certificate } from "@/content/governance";

const PREVIEW_WIDTH = 600;
const PREVIEW_HEIGHT = 850;

/** One registration certificate: its first page, what it is, and a link to the full PDF. */
export function CertificateCard({ certificate }: { certificate: Certificate }) {
  const { title, issuer, numberLabel, number, issuedOn, pdfPath, previewPath, pageCount } =
    certificate;
  return (
    <article className="flex w-full flex-col overflow-hidden rounded-xl border border-border bg-white shadow-card">
      <a
        href={pdfPath}
        target="_blank"
        rel="noopener noreferrer"
        className="group block bg-muted px-8 pt-8"
        tabIndex={-1}
        aria-hidden="true"
      >
        <Image
          src={previewPath}
          alt=""
          width={PREVIEW_WIDTH}
          height={PREVIEW_HEIGHT}
          sizes="(min-width: 1024px) 22rem, (min-width: 768px) 30vw, 90vw"
          className="mx-auto h-72 w-auto rounded-t-md border border-b-0 border-border object-cover object-top shadow-soft transition-transform duration-300 group-hover:-translate-y-1"
        />
      </a>
      <div className="flex flex-1 flex-col border-t border-border p-6">
        <p className="text-xs font-bold tracking-widest text-gold-text uppercase">{issuer}</p>
        <h3 className="mt-2 text-lg font-bold text-foreground">{title}</h3>
        <dl className="mt-4 space-y-2 text-sm">
          <div>
            <dt className="text-muted-foreground">{numberLabel}</dt>
            <dd className="font-semibold text-foreground">{number}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Issued</dt>
            <dd className="font-semibold text-foreground">{issuedOn}</dd>
          </div>
        </dl>
        <div className="mt-auto flex flex-wrap items-center gap-x-5 gap-y-3 pt-6">
          <Button asChild className={ctaButtonVariants({ variant: "gold" })}>
            <a href={pdfPath} target="_blank" rel="noopener noreferrer">
              <FileTextIcon aria-hidden="true" />
              View certificate
              <span className="sr-only">
                {" "}
                {title} (PDF, {pageCount === 1 ? "1 page" : `${String(pageCount)} pages`}, opens in
                a new tab)
              </span>
            </a>
          </Button>
          {certificate.verifyUrl ? (
            <a
              href={certificate.verifyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-navy hover:underline"
            >
              <ShieldCheckIcon className="size-4 text-gold-text" aria-hidden="true" />
              Verify on SECP
              <ExternalLinkIcon className="size-3.5" aria-hidden="true" />
              <span className="sr-only">(opens in a new tab)</span>
            </a>
          ) : null}
        </div>
      </div>
    </article>
  );
}
