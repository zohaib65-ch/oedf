import { SECP_REGISTRATION_NUMBER, SITE_DESCRIPTION, SITE_NAME } from "@/lib/constants/site";
import { absoluteUrl } from "@/lib/seo";
import type { PublicSiteSettingsRecord } from "@/server/repositories/site-settings.repository";
import type { VacancyDetail } from "@/server/repositories/vacancy.repository";
import type { FaqGroup } from "@/server/services/faq.service";
import type { PublicNewsDetail } from "@/server/services/news.service";
import type { PublicPublicationDetail } from "@/server/services/publication.service";

// schema.org structured data for search engines. Every builder returns plain JSON-LD.

const CONTEXT = "https://schema.org";

export function organizationJsonLd(settings: PublicSiteSettingsRecord | null) {
  const { email, address } = settings?.contact ?? { email: "", address: "" };
  const sameAs = Object.values(settings?.social ?? {}).filter((url) => url !== "");
  return {
    "@context": CONTEXT,
    "@type": "NGO",
    name: SITE_NAME,
    description: SITE_DESCRIPTION,
    url: absoluteUrl("/"),
    logo: absoluteUrl("/brand/logo-full.jpeg"),
    identifier: {
      "@type": "PropertyValue",
      name: "SECP registration number",
      value: SECP_REGISTRATION_NUMBER,
    },
    ...(email ? { email } : {}),
    ...(address
      ? { address: { "@type": "PostalAddress", streetAddress: address, addressCountry: "PK" } }
      : {}),
    ...(sameAs.length > 0 ? { sameAs } : {}),
  };
}

export function breadcrumbJsonLd(trail: readonly { name: string; path: string }[]) {
  return {
    "@context": CONTEXT,
    "@type": "BreadcrumbList",
    itemListElement: trail.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function faqJsonLd(groups: readonly FaqGroup[]) {
  return {
    "@context": CONTEXT,
    "@type": "FAQPage",
    mainEntity: groups.flatMap((group) =>
      group.faqs.map((faq) => ({
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: { "@type": "Answer", text: faq.answer },
      })),
    ),
  };
}

const EMPLOYMENT_TYPE_SCHEMA = {
  FULL_TIME: "FULL_TIME",
  PART_TIME: "PART_TIME",
  CONTRACT: "CONTRACTOR",
  INTERNSHIP: "INTERN",
  VOLUNTEER: "VOLUNTEER",
} as const;

export function jobPostingJsonLd(vacancy: VacancyDetail) {
  return {
    "@context": CONTEXT,
    "@type": "JobPosting",
    title: vacancy.title,
    description: vacancy.description,
    datePosted: (vacancy.publishedAt ?? vacancy.deadline).toISOString(),
    validThrough: vacancy.deadline.toISOString(),
    employmentType: EMPLOYMENT_TYPE_SCHEMA[vacancy.employmentType],
    hiringOrganization: { "@type": "Organization", name: SITE_NAME, sameAs: absoluteUrl("/") },
    jobLocation: {
      "@type": "Place",
      address: { "@type": "PostalAddress", addressLocality: vacancy.city, addressCountry: "PK" },
    },
  };
}

export function newsJsonLd(post: PublicNewsDetail) {
  if (post.type === "EVENT") {
    return {
      "@context": CONTEXT,
      "@type": "Event",
      name: post.title,
      description: post.excerpt,
      // A day alone is a date; with a start time it is a moment in Pakistan time (UTC+5).
      ...(post.eventDate
        ? {
            startDate: post.eventStartTime
              ? `${post.eventDate.toISOString().slice(0, 10)}T${post.eventStartTime}:00+05:00`
              : post.eventDate.toISOString().slice(0, 10),
          }
        : {}),
      ...(post.venue ? { location: { "@type": "Place", name: post.venue } } : {}),
      organizer: { "@type": "Organization", name: SITE_NAME, url: absoluteUrl("/") },
    };
  }
  return {
    "@context": CONTEXT,
    "@type": "NewsArticle",
    headline: post.title,
    description: post.excerpt,
    ...(post.publishedAt ? { datePublished: post.publishedAt.toISOString() } : {}),
    author: { "@type": "Organization", name: SITE_NAME },
    publisher: { "@type": "Organization", name: SITE_NAME },
  };
}

export function publicationJsonLd(publication: PublicPublicationDetail) {
  return {
    "@context": CONTEXT,
    "@type": "Report",
    name: publication.title,
    description: publication.summary,
    ...(publication.publishedOn ? { datePublished: publication.publishedOn.toISOString() } : {}),
    ...(publication.authors.length > 0
      ? { author: publication.authors.map((name) => ({ "@type": "Person", name })) }
      : {}),
    publisher: { "@type": "Organization", name: SITE_NAME },
  };
}
