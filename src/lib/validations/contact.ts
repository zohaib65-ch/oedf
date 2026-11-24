import { z } from "zod";

import { MESSAGE_SUBJECTS } from "@/lib/constants/enums";
import {
  emailText,
  longText,
  nameText,
  phoneText,
  spamProtectionShape,
} from "@/lib/validations/common";

export const contactMessageSchema = z.object({
  name: nameText("Name"),
  email: emailText,
  phone: phoneText.or(z.literal("")).default(""),
  subject: z.enum(MESSAGE_SUBJECTS, "Choose a subject"),
  message: longText("Message"),
  ...spamProtectionShape,
});

export type ContactMessageInput = z.infer<typeof contactMessageSchema>;
