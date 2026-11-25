import type { Permission } from "@/lib/constants/permissions";

export interface GuideSection {
  id: string;
  title: string;
  /** Shown only to people who hold this permission. Sections without one are for everyone. */
  permission?: Permission;
  /** Short paragraphs, then the steps or points in order. */
  intro: string;
  points: readonly string[];
}

/**
 * The staff guide shown in the portal. Plain words for people who use the portal, not for
 * developers. Keep it in step with the screens when they change.
 */
export const STAFF_GUIDE: readonly GuideSection[] = [
  {
    id: "getting-started",
    title: "Getting started",
    intro:
      "The portal is where the CEO Office and the four offices manage the website and their work. You see only the modules your role and office need.",
    points: [
      "Your account is created by the Super Admin. The invitation email has a link to set your password; it works once and expires.",
      "Forgot your password? Use “Forgot password” on the sign-in page. The link is sent to your work email.",
      "Your role decides what you can do: Staff prepare and update, Directors decide and publish for their office, the CEO Office sees every office.",
      "Under your name (top right) you find Profile: change your name and password, and sign out of other devices.",
      "Sign out when you use a shared computer.",
    ],
  },
  {
    id: "writing",
    title: "Writing long text",
    intro:
      "Descriptions, answers and news articles are plain text. Two simple rules give them structure on the website.",
    points: [
      "Leave an empty line between paragraphs.",
      "Start a line with a dash and a space (“- ”) to make a bullet list.",
      "Photos need a short description of what they show, for people who cannot see them.",
      "Photos are JPG, PNG or WebP, and PDFs up to 5 MB each.",
    ],
  },
  {
    id: "applications",
    title: "Admission and scholarship applications",
    permission: "applications:read",
    intro:
      "Every application starts as Submitted with a reference number such as OEDF-ADM-2026-000123. Work through it from the list.",
    points: [
      "Filter the list by type, status, program, city or dates, or search by name, reference or CNIC.",
      "Open an application to see the applicant, education, documents and history. Documents open in a new tab through a link that works for 5 minutes; every opening is recorded.",
      "Move it to Under review, tick the checklist (identity, education, eligibility, documents) and mark it Verified.",
      "If something is missing, choose Incomplete and list what is needed. The applicant is emailed and can upload it from the status page.",
      "Directors recommend, approve or reject. The applicant is emailed the decision, never the internal reason.",
      "Approving a scholarship creates its award record.",
      "Archive applications you have finished with; archived ones cannot be changed until restored.",
      "The Admissions Director and the CEO Office can delete an application for good with the trash icon or the Delete application button. One with a scholarship award cannot be deleted until its award is.",
      "Directors can export the filtered list as a CSV file (without CNIC or contact details).",
    ],
  },
  {
    id: "awards",
    title: "Scholarship awards",
    permission: "awards:read",
    intro: "Awards are records of approved scholarships. The portal does not make payments.",
    points: [
      "Set the amount per period, start date and renewal date.",
      "Put an award on hold or end it, and add progress notes.",
      "The Admissions Director can delete an award with the trash icon or the Delete award button. A reason is required: it ends the scholarship, the student is emailed the reason, and their status page shows “Scholarship ended” with it.",
      "Renewals due in the next 30 days show on the overview.",
    ],
  },
  {
    id: "vacancies",
    title: "Vacancies and job applications",
    permission: "vacancies:read",
    intro: "HR writes vacancies as drafts; a Director publishes and closes them.",
    points: [
      "A published vacancy closes on its own after the deadline day.",
      "Candidates apply with a CV. Move them through Shortlisted, Interview and Selected, or Rejected or On hold, with a reason each time.",
      "Set an interview time while a candidate is shortlisted, at interview or on hold. Candidates are not emailed by the portal; contact them yourself.",
      "Directors can export the filtered list of job applications as a CSV file.",
    ],
  },
  {
    id: "programs",
    title: "Programs and institutions",
    permission: "programs:read",
    intro: "Institutional Development keeps the programs and the institutions that offer them.",
    points: [
      "Staff save drafts; a Director publishes them or changes published ones.",
      "Programs marked “Accepts applications” appear in the admission form while published.",
      "A program with applications cannot be deleted: archive it instead.",
      "A Director can delete an institution that has no agreements or reviews; otherwise set it to Closed. Only Active institutions marked “Show on the public website” (the Website box on its page) appear on the website. A Director is asked this when creating one.",
      "Agreements (with a signed PDF) and performance reviews stay inside the portal.",
    ],
  },
  {
    id: "publications",
    title: "Publications",
    permission: "publications:read",
    intro: "Research & Policy publishes reports, papers and briefs on the Research page.",
    points: [
      "Staff save drafts; a Director publishes, edits published ones and deletes after confirming.",
      "Attach the full PDF. Visitors can download it only while the publication is published.",
      "Leave the publish date empty to use the day it is published.",
    ],
  },
  {
    id: "directives",
    title: "Directives",
    permission: "directives:read",
    intro:
      "Research & Policy issues directives to offices. Each office handles its own part, and everything is kept in that part's history.",
    points: [
      "Directors are emailed when a directive is addressed to their office. Acknowledge it, then choose who owns the work.",
      "Anyone in the office starts the work, posts progress updates and marks it completed.",
      "If a directive conflicts with the law, the constitutional documents, a Board resolution or a donor restriction, or cannot be carried out, the Director asks the CEO Office for clarification with the reason.",
      "The CEO Office reopens the part or closes it, and says why.",
      "Overdue directives (past their due day and not finished) are marked in red on the overview and in the list.",
    ],
  },
  {
    id: "news",
    title: "News, events and FAQs",
    permission: "news:manage",
    intro: "The CEO Office keeps the News page and the FAQs.",
    points: [
      "An event needs a date; a start time and venue are optional.",
      "The search title and description are optional; the title and excerpt are used when they are empty.",
      "FAQs are grouped by topic. Pick an existing topic from the list so a typo does not create a second one.",
      "Use the arrow buttons to change the order of questions in a topic. Unpublished questions stay hidden from the website.",
      "Deleting asks for confirmation and is recorded in the audit log.",
    ],
  },
  {
    id: "messages",
    title: "Messages",
    permission: "messages:read",
    intro:
      "Messages from the contact form reach the office their subject belongs to. The CEO Office sees all of them.",
    points: [
      "New messages are in bold. Opening one marks it as read.",
      "“Reply by email” opens your mail app with the sender's address. Mark the message as replied once you have answered.",
      "Archive messages you no longer need in the inbox.",
      "Directors and the CEO Office can delete a message for good with the trash icon in the list or the Delete message button.",
    ],
  },
  {
    id: "administration",
    title: "Users and settings",
    permission: "users:manage",
    intro: "The Super Admin manages accounts and the website's contact details.",
    points: [
      "Create an account with a name, work email, role and office. The person gets an email to set their password.",
      "Deactivate accounts of people who leave; this signs them out at once. An account added by mistake can be deleted while the person has not worked in the portal yet; after that it can only be deactivated.",
      "Settings hold the contact details, social links, impact numbers and the site announcement.",
      "Team (in the menu) holds the people on the public Team page: add, edit, hide, reorder with the arrows, or delete with the trash icon.",
    ],
  },
  {
    id: "help",
    title: "Privacy and getting help",
    intro: "Applicants trust us with personal details. Treat them with care.",
    points: [
      "Lists show only the last four CNIC digits. Do not copy CNIC numbers, documents or financial details into notes or emails.",
      "Download only what you need, and delete downloaded files when you are done.",
      "Something not working? Note what you did and the time, and tell the Super Admin.",
    ],
  },
];
