import { z } from "zod";

import { emailText } from "@/lib/validations/common";

/**
 * The one password minimum: forms, the seed script and Better Auth all use it. 9 is the client's
 * decision (the brief asked for 12; docs/open-questions.md, D31).
 */
export const MIN_PASSWORD_LENGTH = 9;
const MAX_PASSWORD_LENGTH = 128;

const newPassword = z
  .string()
  .min(MIN_PASSWORD_LENGTH, `Use at least ${MIN_PASSWORD_LENGTH} characters`)
  .max(MAX_PASSWORD_LENGTH, "This password is too long");

export const signInSchema = z.object({
  email: emailText,
  password: z.string().min(1, "Enter your password"),
});

export const forgotPasswordSchema = z.object({ email: emailText });

export const resetPasswordSchema = z
  .object({ password: newPassword, confirmPassword: z.string() })
  .refine((value) => value.password === value.confirmPassword, {
    path: ["confirmPassword"],
    error: "The passwords do not match",
  });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password"),
    newPassword,
    confirmPassword: z.string(),
  })
  .refine((value) => value.newPassword === value.confirmPassword, {
    path: ["confirmPassword"],
    error: "The passwords do not match",
  });

export const profileSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name is too long"),
});
