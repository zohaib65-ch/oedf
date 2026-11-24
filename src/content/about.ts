import {
  Eye,
  HeartHandshake,
  Lightbulb,
  Scale,
  Target,
  Users,
  type LucideIcon,
} from "lucide-react";

/** Draft copy for the About page. The client has not reviewed it yet (docs/open-questions.md, D9). */

export const ABOUT_STORY = [
  "Omar Education Development Foundation is a non-profit foundation working to widen access to education in Pakistan.",
  "The foundation brings together four departments. Admissions and Scholarships supports learners, Human Resources and Teacher Management recruits for its institutions, Institutional Development and Management oversees partner schools and training centers, and the Research and Policy Institute publishes evidence to guide decisions.",
] as const;

export const MISSION =
  "To help learners enter, stay in and complete education, and to build the skills they need for work.";

export const VISION =
  "A Pakistan where a learner's future is decided by effort and ability, not by what their family can afford.";

export const CORE_VALUES: readonly { icon: LucideIcon; title: string; description: string }[] = [
  { icon: Scale, title: "Integrity", description: "We act openly and keep our promises." },
  { icon: Users, title: "Inclusion", description: "Every learner deserves a fair chance." },
  { icon: Lightbulb, title: "Evidence", description: "We use research to decide where to help." },
  { icon: HeartHandshake, title: "Service", description: "We exist for the learners we serve." },
];

export const MISSION_VISION_ICONS = { mission: Target, vision: Eye } as const;

export const CEO_MESSAGE = {
  name: "Prof. Omar Farooq",
  title: "Chief Executive Officer",
  isDraft: true as boolean,
  paragraphs: [
    "A message from the Chief Executive Officer will be published here.",
    "This text is a placeholder until Prof. Omar Farooq provides his own words.",
  ],
} as const;
