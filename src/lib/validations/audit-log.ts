import type { z } from "zod";

import { filterDate, filterText, listQuerySchema, sortParam } from "@/lib/validations/common";

const AUDIT_LOG_SORT_FIELDS = ["createdAt"] as const;

export const auditLogQuerySchema = listQuerySchema.omit({ q: true }).extend({
  entityType: filterText,
  action: filterText,
  from: filterDate,
  to: filterDate,
  sort: sortParam(AUDIT_LOG_SORT_FIELDS, "-createdAt"),
});

export type AuditLogQuery = z.infer<typeof auditLogQuerySchema>;
