/**
 * Placeholder legal text. It is clearly marked as a draft because the client's lawyer must write
 * or approve the final version (docs/open-questions.md, D9).
 */

export const LEGAL_DRAFT_NOTICE =
  "Draft for review: this text is a placeholder and is not legal advice. The foundation must replace or approve it before the site goes live.";

interface LegalDocument {
  title: string;
  description: string;
  sections: readonly { heading: string; body: string }[];
}

export const PRIVACY_POLICY: LegalDocument = {
  title: "Privacy policy",
  description: "How the foundation collects, uses and protects personal information.",
  sections: [
    {
      heading: "What we collect",
      body: "When you apply, contact us or apply for a job, we collect the details you enter in the form and the documents you upload.",
    },
    {
      heading: "How we use it",
      body: "We use your information to process your application or message, to contact you about it, and to keep records the law requires.",
    },
    {
      heading: "Who can see it",
      body: "Only staff of the relevant department can see your application. We do not sell personal information.",
    },
    {
      heading: "Your choices",
      body: "You can ask us to correct your information or to explain how it is used by writing to the contact address on this site.",
    },
  ],
};

export const TERMS: LegalDocument = {
  title: "Terms of use",
  description: "The terms for using this website.",
  sections: [
    {
      heading: "Using this site",
      body: "You may use this site to learn about the foundation and to submit applications and messages. You must give accurate information.",
    },
    {
      heading: "Applications",
      body: "Submitting an application does not guarantee admission or a scholarship. Decisions follow the foundation's published criteria.",
    },
    {
      heading: "Content",
      body: "The text and design of this site belong to the foundation. Do not copy them without permission.",
    },
    {
      heading: "Changes",
      body: "We may update these terms. The version published on this page applies.",
    },
  ],
};
