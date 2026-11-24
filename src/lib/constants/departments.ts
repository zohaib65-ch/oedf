import type { DEPARTMENT_CODES } from "@/lib/constants/enums";

interface DepartmentSeed {
  code: (typeof DEPARTMENT_CODES)[number];
  slug: string;
  name: string;
  purpose: string;
  responsibilities: string[];
  order: number;
}

/**
 * The foundation's five offices. The purposes and responsibilities are short drafts written from
 * the module ownership in the project brief; the client still has to confirm them
 * (docs/open-questions.md, C25).
 */
export const DEPARTMENTS: readonly DepartmentSeed[] = [
  {
    code: "CEO_OFFICE",
    slug: "chief-executive-office",
    name: "Chief Executive Office",
    purpose:
      "Provides executive leadership and oversight of the foundation and its four departments.",
    responsibilities: [
      "Final decisions and escalations",
      "Foundation-wide oversight",
      "News, events and public information",
      "Frequently asked questions",
    ],
    order: 1,
  },
  {
    code: "ADMISSIONS_SCHOLARSHIPS",
    slug: "admissions-and-scholarships",
    name: "Admissions & Scholarships",
    purpose:
      "Manages admission and scholarship applications from first submission to final decision.",
    responsibilities: [
      "Review and verify admission applications",
      "Review and verify scholarship applications",
      "Record scholarship awards and renewals",
      "Support applicants through the process",
    ],
    order: 2,
  },
  {
    code: "HR_TEACHER_MANAGEMENT",
    slug: "human-resources-and-teacher-management",
    name: "Human Resources & Teacher Management",
    purpose: "Manages vacancies and recruitment for the foundation and its institutions.",
    responsibilities: [
      "Publish and manage vacancies",
      "Review job applications",
      "Shortlist candidates and record recommendations",
    ],
    order: 3,
  },
  {
    code: "INSTITUTIONAL_DEVELOPMENT",
    slug: "institutional-development-and-management",
    name: "Institutional Development & Management",
    purpose:
      "Develops and oversees the foundation's partner institutions and educational programs.",
    responsibilities: [
      "Maintain the register of schools, colleges and training centers",
      "Manage agreements and performance reviews",
      "Manage educational and vocational programs",
    ],
    order: 4,
  },
  {
    code: "RESEARCH_POLICY",
    slug: "research-and-policy-institute",
    name: "Research & Policy Institute",
    purpose: "Produces research and policy work and issues directives to the foundation's offices.",
    responsibilities: [
      "Publish reports, policy papers, studies and briefs",
      "Issue directives and follow their progress",
    ],
    order: 5,
  },
];

/** Public pages that belong to each office, shown on its page. */
export const DEPARTMENT_RELATED_PAGES: Record<
  DepartmentSeed["code"],
  readonly { label: string; href: string }[]
> = {
  CEO_OFFICE: [
    { label: "News and events", href: "/news" },
    { label: "Frequently asked questions", href: "/faqs" },
    { label: "Governance", href: "/governance" },
  ],
  ADMISSIONS_SCHOLARSHIPS: [
    { label: "Admissions", href: "/admissions" },
    { label: "Scholarships", href: "/scholarships" },
    { label: "Application status", href: "/application-status" },
  ],
  HR_TEACHER_MANAGEMENT: [{ label: "Careers and open vacancies", href: "/careers" }],
  INSTITUTIONAL_DEVELOPMENT: [
    { label: "Programs", href: "/programs" },
    { label: "Institutions", href: "/institutions" },
  ],
  RESEARCH_POLICY: [{ label: "Research and publications", href: "/research" }],
};
