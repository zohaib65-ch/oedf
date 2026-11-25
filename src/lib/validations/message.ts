import { z } from "zod";

import { MESSAGE_STATUSES, MESSAGE_SUBJECTS } from "@/lib/constants/enums";
import { filterEnum, listQuerySchema, sortParam } from "@/lib/validations/common";

/** The inbox: newest first unless sorted otherwise; search matches name or email. */
export const listMessagesQuerySchema = listQuerySchema.extend({
  status: filterEnum(MESSAGE_STATUSES),
  subject: filterEnum(MESSAGE_SUBJECTS),
  sort: sortParam(["createdAt", "name"], "-createdAt"),
});

export const messageUpdateSchema = z.object({
  status: z.enum(MESSAGE_STATUSES, { error: "Choose a status" }),
});

export type ListMessagesQuery = z.infer<typeof listMessagesQuerySchema>;
export type MessageUpdateInput = z.infer<typeof messageUpdateSchema>;
