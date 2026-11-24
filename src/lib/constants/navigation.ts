import {
  Award,
  Building2,
  ClipboardList,
  FilePen,
  GraduationCap,
  LayoutDashboard,
  type LucideIcon,
  ScrollTextIcon,
  SettingsIcon,
  UsersIcon,
} from "lucide-react";

import { DEPARTMENTS } from "@/lib/constants/departments";
import type { Permission } from "@/lib/constants/permissions";

export interface NavLink {
  label: string;
  href: string;
  description?: string;
  icon?: LucideIcon;
}

export interface NavItem extends NavLink {
  children?: readonly NavLink[];
}

export const APPLY_NOW_LINK: NavLink = { label: "Apply now", href: "/admissions/apply" };

/** The public site's main navigation. Items with `children` open a dropdown (desktop) or accordion (mobile). */
export const SITE_NAV: readonly NavItem[] = [
  { label: "About", href: "/about" },
  {
    label: "Departments",
    href: "/departments",
    children: DEPARTMENTS.map((department) => ({
      label: department.name,
      href: `/departments/${department.slug}`,
      description: department.purpose,
      icon: Building2,
    })),
  },
  { label: "Programs", href: "/programs" },
  {
    label: "Admissions & Scholarships",
    href: "/admissions",
    children: [
      {
        label: "Admissions",
        icon: GraduationCap,
        href: "/admissions",
        description: "Eligibility, required documents, dates and steps.",
      },
      {
        label: "Scholarships",
        icon: Award,
        href: "/scholarships",
        description: "Scholarship types, eligibility and renewal rules.",
      },
      {
        label: "Apply for admission",
        icon: FilePen,
        href: "/admissions/apply",
        description: "Start your online admission application.",
      },
      {
        label: "Apply for a scholarship",
        icon: FilePen,
        href: "/scholarships/apply",
        description: "Start your online scholarship application.",
      },
      {
        label: "Application status",
        icon: ClipboardList,
        href: "/application-status",
        description: "Check where your application stands.",
      },
    ],
  },
  { label: "Careers", href: "/careers" },
  { label: "Research", href: "/research" },
  { label: "News", href: "/news" },
  { label: "Contact", href: "/contact" },
];

export const FOOTER_NAV: readonly { title: string; links: readonly NavLink[] }[] = [
  {
    title: "Foundation",
    links: [
      { label: "About", href: "/about" },
      { label: "Governance", href: "/governance" },
      { label: "Departments", href: "/departments" },
      { label: "Programs", href: "/programs" },
      { label: "Institutions", href: "/institutions" },
      { label: "Research", href: "/research" },
      { label: "News and events", href: "/news" },
    ],
  },
  {
    title: "Apply and support",
    links: [
      { label: "Admissions", href: "/admissions" },
      { label: "Scholarships", href: "/scholarships" },
      { label: "Application status", href: "/application-status" },
      { label: "Careers", href: "/careers" },
      { label: "FAQs", href: "/faqs" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy policy", href: "/privacy-policy" },
      { label: "Terms", href: "/terms" },
    ],
  },
];

export const PORTAL_HOME_PATH = "/portal";
export const PORTAL_SIGN_IN_PATH = "/portal/sign-in";

export interface PortalNavLink extends NavLink {
  icon: LucideIcon;
  /** The sidebar shows the link only to people who hold this permission. */
  permission: Permission;
}

/** The portal sidebar. Modules are added here as their screens are built. */
export const PORTAL_NAV: readonly PortalNavLink[] = [
  {
    label: "Overview",
    href: PORTAL_HOME_PATH,
    icon: LayoutDashboard,
    permission: "dashboard:read",
  },
  {
    label: "Applications",
    href: "/portal/applications",
    icon: ClipboardList,
    permission: "applications:read",
  },
  {
    label: "Scholarship awards",
    href: "/portal/scholarship-awards",
    icon: Award,
    permission: "awards:read",
  },
  { label: "Users", href: "/portal/users", icon: UsersIcon, permission: "users:manage" },
  { label: "Settings", href: "/portal/settings", icon: SettingsIcon, permission: "settings:read" },
  { label: "Audit log", href: "/portal/audit-log", icon: ScrollTextIcon, permission: "audit:read" },
];

/** Pages reached from the user menu rather than the sidebar. */
export const PORTAL_PROFILE_LINK: NavLink = { label: "Profile", href: "/portal/profile" };
