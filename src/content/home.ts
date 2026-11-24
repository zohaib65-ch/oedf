import {
  Award,
  BookOpenCheck,
  Briefcase,
  ClipboardCheck,
  FileUp,
  GraduationCap,
  HandHeart,
  Landmark,
  LineChart,
  type LucideIcon,
  Scale,
  Search,
  ShieldCheck,
  Wrench,
} from "lucide-react";

import { SECP_REGISTRATION_NUMBER } from "@/lib/constants/site";

/**
 * Draft copy for the home page, written from the foundation's name and the project brief. The
 * client has not reviewed it yet (docs/open-questions.md, D9).
 */

interface TextBlock {
  icon: LucideIcon;
  title: string;
  description: string;
}

export const HERO = {
  eyebrow: "Education development foundation",
  title: "Education that opens doors for every learner",
  description:
    "Omar Education Development Foundation supports admissions, scholarships and skills programs, and publishes research to improve education in Pakistan.",
} as const;

export const HERO_MINI_CARDS: readonly (TextBlock & { href: string })[] = [
  {
    icon: GraduationCap,
    title: "Admissions",
    description: "Eligibility, documents and steps.",
    href: "/admissions",
  },
  {
    icon: Award,
    title: "Scholarships",
    description: "Support for learners in financial need.",
    href: "/scholarships",
  },
  {
    icon: Briefcase,
    title: "Careers",
    description: "Open vacancies at the foundation.",
    href: "/careers",
  },
];

export const VALUE_CARDS: readonly TextBlock[] = [
  {
    icon: BookOpenCheck,
    title: "Education first",
    description:
      "We back schools, colleges and programs that help learners finish what they start.",
  },
  {
    icon: Wrench,
    title: "Skills for work",
    description: "Vocational and skills programs prepare learners for freelancing and employment.",
  },
  {
    icon: HandHeart,
    title: "Support where it is needed",
    description: "Scholarships go to learners whose families cannot meet the cost of study.",
  },
];

export const WHY_OEDF = {
  eyebrow: "Governance and trust",
  title: "A foundation you can hold to account",
  description: "How the foundation is registered, run and answerable for its work.",
  items: [
    {
      icon: Landmark,
      title: "Registered with SECP",
      description: `Registered with the Securities and Exchange Commission of Pakistan, registration number ${SECP_REGISTRATION_NUMBER}.`,
    },
    {
      icon: Scale,
      title: "Clear accountability",
      description: "Every office has a defined purpose and a director who answers for it.",
    },
    {
      icon: ShieldCheck,
      title: "Transparent decisions",
      description: "Applications follow a recorded process, and applicants can check their status.",
    },
    {
      icon: Award,
      title: "Merit and need",
      description: "Scholarships are awarded on published criteria, not on personal connections.",
    },
  ] satisfies readonly TextBlock[],
} as const;

export const APPLICANT_GUIDANCE = {
  eyebrow: "Before you apply",
  title: "Have these ready",
  description: "Applying takes one sitting if your documents are ready.",
  checklist: [
    "A recent passport-size photograph",
    "A copy of your CNIC or B-Form",
    "Your latest result card",
    "For scholarships: proof of your family's income",
  ],
} as const;

export const HOW_TO_APPLY = {
  eyebrow: "How to apply",
  title: "Four steps from start to decision",
  steps: [
    {
      icon: Search,
      title: "Check eligibility",
      description: "Read the requirements for the admission or scholarship you want.",
    },
    {
      icon: FileUp,
      title: "Prepare your documents",
      description: "Scan or photograph your documents as PDF, JPG or PNG files.",
    },
    {
      icon: ClipboardCheck,
      title: "Submit online",
      description: "Complete the form and receive your reference number by email.",
    },
    {
      icon: LineChart,
      title: "Track your application",
      description: "Use your reference number and email to see where it stands.",
    },
  ] satisfies readonly TextBlock[],
} as const;
