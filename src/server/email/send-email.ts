import "server-only";
import nodemailer, { type Transporter } from "nodemailer";
import type { ReactElement } from "react";
import { render } from "react-email";

import { getServerEnv } from "@/env";
import { logger } from "@/server/lib/logger";

interface EmailMessage {
  to: string;
  subject: string;
  /** A React Email template. It is sent as HTML with a plain-text version beside it. */
  template: ReactElement;
  replyTo?: string;
}

let transport: Transporter | undefined;

function getTransport(): Transporter {
  transport ??= nodemailer.createTransport(getServerEnv().SMTP_URL);
  return transport;
}

/**
 * Sends one email. A failure is logged and returned as `false`, never thrown: the record the email
 * is about (an application, a message) is already saved, and the visitor has seen it succeed.
 * The log names the subject only, never the recipient.
 */
export async function sendEmail({
  to,
  subject,
  template,
  replyTo,
}: EmailMessage): Promise<boolean> {
  try {
    const [html, text] = await Promise.all([
      render(template),
      render(template, { plainText: true }),
    ]);
    await getTransport().sendMail({
      from: getServerEnv().EMAIL_FROM,
      to,
      subject,
      html,
      text,
      ...(replyTo ? { replyTo } : {}),
    });
    return true;
  } catch (error: unknown) {
    logger.error({ err: error, subject }, "Could not send an email");
    return false;
  }
}
