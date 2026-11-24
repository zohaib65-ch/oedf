import { z } from "zod";

import { isoDateText, listQuerySchema } from "@/lib/validations/common";

const MAX_FILTER_LENGTH = 80;
const filterText = z.string().trim().min(1).max(MAX_FILTER_LENGTH).optional().catch(undefined);
const filterDate = isoDateText.optional().catch(undefined);

export const auditLogQuerySchema = listQuerySchema.omit({ q: true }).extend({
  entityType: filterText,
  action: filterText,
  from: filterDate,
  to: filterDate,
});

export type AuditLogQuery = z.infer<typeof auditLogQuerySchema>;
