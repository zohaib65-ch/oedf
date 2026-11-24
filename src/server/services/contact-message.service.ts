import "server-only";

import { SUBJECT_DEPARTMENT_CODE } from "@/lib/constants/departments";
import { MESSAGE_SUBJECT_LABELS } from "@/lib/constants/labels";
import type { ContactMessageInput } from "@/lib/validations/contact";
import { sendEmail } from "@/server/email/send-email";
import { ContactMessageEmail } from "@/server/email/templates/contact-message-email";
import { AppError } from "@/server/http/errors";
import { createContactMessage } from "@/server/repositories/contact-message.repository";
import { findDepartmentContact } from "@/server/repositories/department.repository";
import { findPublicSiteSettings } from "@/server/repositories/site-settings.repository";

/**
 * Saves a message to the portal inbox of the office its subject belongs to, then emails that office.
 * The office's own address is used first, then the general email in Settings. With neither, the
 * message is only saved.
 */
export async function submitContactMessage(input: ContactMessageInput): Promise<void> {
  const department = await findDepartmentContact(SUBJECT_DEPARTMENT_CODE[input.subject]);
  if (!department) {
    throw new AppError("INTERNAL_ERROR", "Your message could not be sent. Please try again later.");
  }

  await createContactMessage({
    name: input.name,
    email: input.email,
    phone: input.phone,
    subject: input.subject,
    message: input.message,
    departmentId: department.id,
  });

  const recipient =
    department.notificationEmail || (await findPublicSiteSettings())?.contact.email || "";
  if (recipient) {
    await sendEmail({
      to: recipient,
      replyTo: input.email,
      subject: `New message: ${MESSAGE_SUBJECT_LABELS[input.subject]}`,
      template: ContactMessageEmail({
        departmentName: department.name,
        name: input.name,
        email: input.email,
        phone: input.phone,
        subjectLabel: MESSAGE_SUBJECT_LABELS[input.subject],
        message: input.message,
      }),
    });
  }
}
