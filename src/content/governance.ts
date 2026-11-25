/** Draft copy for the Governance page. The client has not reviewed it yet (docs/open-questions.md, D9). */

export const GOVERNANCE_INTRO =
  "The foundation is led by its Chief Executive Officer and run through four departments. Each department has a defined purpose, and its director answers to the Chief Executive Office.";

export const KEY_POLICIES: readonly { title: string; description: string }[] = [
  {
    title: "Admissions and scholarships",
    description: "How applications are received, reviewed and decided.",
  },
  {
    title: "Privacy and data protection",
    description: "How applicants' personal information is collected, used and protected.",
  },
  {
    title: "Conflicts of interest",
    description: "How staff and directors declare and manage interests.",
  },
  {
    title: "Complaints",
    description: "How to raise a concern and how the foundation responds.",
  },
];

export const POLICY_DRAFT_NOTICE =
  "Draft: the policy documents have not been supplied yet. These headings show what the foundation intends to publish.";

export interface Certificate {
  title: string;
  issuer: string;
  /** What the number is called on the certificate, for example "CUIN". */
  numberLabel: string;
  number: string;
  /** As printed on the certificate. */
  issuedOn: string;
  /** The full certificate, in `public/certificates/`. */
  pdfPath: string;
  /** Its first page as an image (600 × 850). */
  previewPath: string;
  pageCount: number;
  /** The issuer's own page for checking the certificate, when the certificate prints one. */
  verifyUrl?: string;
}

/** The foundation's registration documents, shown on the Governance page. */
export const CERTIFICATES: readonly Certificate[] = [
  {
    title: "Certificate of Incorporation",
    issuer: "Securities and Exchange Commission of Pakistan",
    numberLabel: "Corporate Unique Identification No.",
    number: "0361535",
    issuedOn: "16 October 2026",
    pdfPath: "/certificates/secp-certificate-of-incorporation.pdf",
    previewPath: "/certificates/secp-certificate-of-incorporation.webp",
    pageCount: 1,
    verifyUrl: "https://leap.secp.gov.pk/#/verify-company-info/0361535",
  },
  {
    title: "Licence under Section 42, Companies Act 2017",
    issuer: "Securities and Exchange Commission of Pakistan",
    numberLabel: "Licence No.",
    number: "A091866",
    issuedOn: "30 September 2026",
    pdfPath: "/certificates/secp-licence.pdf",
    previewPath: "/certificates/secp-licence.webp",
    pageCount: 2,
  },
  {
    title: "Taxpayer Registration Certificate",
    issuer: "Federal Board of Revenue",
    numberLabel: "Registration No.",
    number: "K476720",
    issuedOn: "16 October 2026",
    pdfPath: "/certificates/fbr-taxpayer-registration.pdf",
    previewPath: "/certificates/fbr-taxpayer-registration.webp",
    pageCount: 1,
  },
];
