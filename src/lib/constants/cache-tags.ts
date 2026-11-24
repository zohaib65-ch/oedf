/** Cache tags for public content. A service that changes content invalidates the matching tag. */
export const CACHE_TAGS = {
  settings: "settings",
  departments: "departments",
  programs: "programs",
  institutions: "institutions",
  vacancies: "vacancies",
  publications: "publications",
  news: "news",
  faqs: "faqs",
} as const;
