import { z } from "zod";

import { ROLES } from "@/lib/constants/enums";
import {
  emailText,
  filterEnum,
  listQuerySchema,
  nameText,
  objectIdText,
  sortParam,
} from "@/lib/validations/common";

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

const USER_SORT_FIELDS = ["name", "email", "role", "createdAt"] as const;

export const listUsersQuerySchema = listQuerySchema.extend({
  role: filterEnum(ROLES),
  sort: sortParam(USER_SORT_FIELDS, "-createdAt"),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;
