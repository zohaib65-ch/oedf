import { z } from "zod";

import {
  EMPLOYMENT_TYPES,
  INSTITUTION_TYPES,
  NEWS_TYPES,
  PROGRAM_CATEGORIES,
  PUBLICATION_TYPES,
} from "@/lib/constants/enums";

export const PAGE_SIZE = 9;
const MAX_PAGE = 500;
const MAX_SEARCH_LENGTH = 100;
const MIN_YEAR = 1990;
const MAX_YEAR = 2100;
const MAX_FILTER_LENGTH = 80;

// A bad or unknown value in the URL is ignored instead of failing the page, so old shared links keep working.
const optionalEnum = <T extends readonly [string, ...string[]]>(values: T) =>
  z.enum(values).optional().catch(undefined);

const optionalText = (maxLength: number) =>
  z.string().trim().min(1).max(maxLength).optional().catch(undefined);

const page = z.coerce.number().int().min(1).max(MAX_PAGE).catch(1);

const programsSchema = z.object({ category: optionalEnum(PROGRAM_CATEGORIES) });

const institutionsSchema = z.object({
  city: optionalText(MAX_FILTER_LENGTH),
  type: optionalEnum(INSTITUTION_TYPES),
});

const vacanciesSchema = z.object({
  department: optionalText(MAX_FILTER_LENGTH),
  city: optionalText(MAX_FILTER_LENGTH),
  type: optionalEnum(EMPLOYMENT_TYPES),
});

const publicationsSchema = z.object({
  type: optionalEnum(PUBLICATION_TYPES),
  year: z.coerce.number().int().min(MIN_YEAR).max(MAX_YEAR).optional().catch(undefined),
  q: optionalText(MAX_SEARCH_LENGTH),
  page,
});

const newsSchema = z.object({ type: optionalEnum(NEWS_TYPES), page });

export type ProgramFilters = z.infer<typeof programsSchema>;
export type InstitutionFilters = z.infer<typeof institutionsSchema>;
export type VacancyFilters = z.infer<typeof vacanciesSchema>;
export type PublicationFilters = z.infer<typeof publicationsSchema>;
export type NewsFilters = z.infer<typeof newsSchema>;

type RawSearchParams = Record<string, string | string[] | undefined>;

// A repeated parameter (?type=a&type=b) arrives as an array. Only the first value counts.
function firstValues(raw: RawSearchParams): Record<string, string | undefined> {
  return Object.fromEntries(
    Object.entries(raw).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value]),
  );
}

export const parseProgramFilters = (raw: RawSearchParams): ProgramFilters =>
  programsSchema.parse(firstValues(raw));
export const parseInstitutionFilters = (raw: RawSearchParams): InstitutionFilters =>
  institutionsSchema.parse(firstValues(raw));
export const parseVacancyFilters = (raw: RawSearchParams): VacancyFilters =>
  vacanciesSchema.parse(firstValues(raw));
export const parsePublicationFilters = (raw: RawSearchParams): PublicationFilters =>
  publicationsSchema.parse(firstValues(raw));
export const parseNewsFilters = (raw: RawSearchParams): NewsFilters =>
  newsSchema.parse(firstValues(raw));
