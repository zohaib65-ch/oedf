import { z } from "zod";

import { ROLES } from "@/lib/constants/enums";
import { emailText, listQuerySchema, nameText, objectIdText } from "@/lib/validations/common";

const roleChoice = z.enum(ROLES, { error: "Choose a role" });

export const createUserSchema = z.object({
  name: nameText("Name"),
  email: emailText,
  role: roleChoice,
  departmentId: objectIdText,
});

export const updateUserSchema = z
  .object({
    name: nameText("Name"),
    role: roleChoice,
    departmentId: objectIdText,
    isActive: z.boolean(),
  })
  .partial()
  .refine((value) => Object.keys(value).length > 0, "Nothing to change");

export const listUsersQuerySchema = listQuerySchema.extend({
  role: z.enum(ROLES).optional().catch(undefined),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;
