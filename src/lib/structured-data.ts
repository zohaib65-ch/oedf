import { SECP_REGISTRATION_NUMBER, SITE_DESCRIPTION, SITE_NAME } from "@/lib/constants/site";
import { absoluteUrl } from "@/lib/seo";
import type { PublicSiteSettingsRecord } from "@/server/repositories/site-settings.repository";
import type { VacancyDetail } from "@/server/repositories/vacancy.repository";
import type { FaqGroup } from "@/server/services/faq.service";
import type { PublicNewsDetail } from "@/server/services/news.service";
import type { PublicProgramDetail } from "@/server/services/program.service";
import type { PublicPublicationDetail } from "@/server/services/publication.service";

// schema.org structured data for search engines. Every builder returns plain JSON-LD.

const CONTEXT = "https://schema.org";
/** One ID for the foundation, so every page's data points to the same organisation. */
const ORGANIZATION_ID = absoluteUrl("/#organization");
const PUBLISHER = { "@type": "Organization", "@id": ORGANIZATION_ID, name: SITE_NAME } as const;

/** The site itself, for the home page. */
export function websiteJsonLd() {
  return {
    "@context": CONTEXT,
    "@type": "WebSite",
    "@id": absoluteUrl("/#website"),
    name: SITE_NAME,
    alternateName: "OEDF",
    url: absoluteUrl("/"),
    inLanguage: "en-PK",
    publisher: { "@id": ORGANIZATION_ID },
  };
}

export function organizationJsonLd(settings: PublicSiteSettingsRecord | null) {
  const { email, address } = settings?.contact ?? { email: "", address: "" };
  const sameAs = Object.values(settings?.social ?? {}).filter((url) => url !== "");
  return {
    "@context": CONTEXT,
    "@type": ["NGO", "EducationalOrganization"],
    "@id": ORGANIZATION_ID,
    name: SITE_NAME,
    alternateName: "OEDF",
    description: SITE_DESCRIPTION,
    url: absoluteUrl("/"),
    logo: absoluteUrl("/brand/logo-full.jpeg"),
    areaServed: { "@type": "Country", name: "Pakistan" },
    identifier: {
      "@type": "PropertyValue",
      name: "SECP registration number",
      value: SECP_REGISTRATION_NUMBER,
    },
    ...(email
      ? {
          email,
          contactPoint: {
            "@type": "ContactPoint",
            contactType: "customer support",
            email,
            url: absoluteUrl("/contact"),
            availableLanguage: ["English", "Urdu"],
          },
        }
      : {}),
    ...(address
      ? { address: { "@type": "PostalAddress", streetAddress: address, addressCountry: "PK" } }
      : {}),
    ...(sameAs.length > 0 ? { sameAs } : {}),
  };
}

/** The trail from the home page to this page. Home is added first. */
export function breadcrumbJsonLd(trail: readonly { name: string; path: string }[]) {
  return {
    "@context": CONTEXT,
    "@type": "BreadcrumbList",
    itemListElement: [{ name: "Home", path: "/" }, ...trail].map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function programJsonLd(program: PublicProgramDetail) {
  return {
    "@context": CONTEXT,
    "@type": "EducationalOccupationalProgram",
    name: program.title,
    description: program.summary,
    url: absoluteUrl(`/programs/${program.slug}`),
    ...(program.image ? { image: program.image.url } : {}),
    provider: { ...PUBLISHER, url: absoluteUrl("/") },
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
    url: absoluteUrl(`/careers/${vacancy.slug}`),
    // Candidates apply on the vacancy's own page.
    directApply: true,
    description: vacancy.description,
    datePosted: (vacancy.publishedAt ?? vacancy.deadline).toISOString(),
    validThrough: vacancy.deadline.toISOString(),
    employmentType: EMPLOYMENT_TYPE_SCHEMA[vacancy.employmentType],
    hiringOrganization: {
      ...PUBLISHER,
      sameAs: absoluteUrl("/"),
      logo: absoluteUrl("/brand/logo-full.jpeg"),
    },
    jobLocation: {
      "@type": "Place",
      address: { "@type": "PostalAddress", addressLocality: vacancy.city, addressCountry: "PK" },
    },
  };
}

export function newsJsonLd(post: PublicNewsDetail) {
  const url = absoluteUrl(`/news/${post.slug}`);
  // The cover when there is one, otherwise the page's generated share image.
  const image = post.image?.url ?? absoluteUrl(`/news/${post.slug}/opengraph-image`);
  if (post.type === "EVENT") {
    return {
      "@context": CONTEXT,
      "@type": "Event",
      name: post.title,
      description: post.excerpt,
      url,
      image,
      eventStatus: "https://schema.org/EventScheduled",
      eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
      // A day alone is a date; with a start time it is a moment in Pakistan time (UTC+5).
      ...(post.eventDate
        ? {
            startDate: post.eventStartTime
              ? `${post.eventDate.toISOString().slice(0, 10)}T${post.eventStartTime}:00+05:00`
              : post.eventDate.toISOString().slice(0, 10),
          }
        : {}),
      ...(post.venue
        ? {
            location: {
              "@type": "Place",
              name: post.venue,
              address: { "@type": "PostalAddress", addressCountry: "PK" },
            },
          }
        : {}),
      organizer: { ...PUBLISHER, url: absoluteUrl("/") },
    };
  }
  return {
    "@context": CONTEXT,
    "@type": "NewsArticle",
    headline: post.title,
    description: post.excerpt,
    url,
    mainEntityOfPage: url,
    image: [image],
    inLanguage: "en-PK",
    ...(post.publishedAt ? { datePublished: post.publishedAt.toISOString() } : {}),
    author: { ...PUBLISHER, url: absoluteUrl("/") },
    publisher: { ...PUBLISHER, logo: absoluteUrl("/brand/logo-full.jpeg") },
  };
}

export function publicationJsonLd(publication: PublicPublicationDetail) {
  return {
    "@context": CONTEXT,
    "@type": "Report",
    name: publication.title,
    description: publication.summary,
    url: absoluteUrl(`/research/${publication.slug}`),
    image: publication.image?.url ?? absoluteUrl(`/research/${publication.slug}/opengraph-image`),
    inLanguage: "en-PK",
    ...(publication.publishedOn ? { datePublished: publication.publishedOn.toISOString() } : {}),
    ...(publication.authors.length > 0
      ? { author: publication.authors.map((name) => ({ "@type": "Person", name })) }
      : {}),
    publisher: PUBLISHER,
  };
}
