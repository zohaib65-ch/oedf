import { Link, Text } from "@react-email/components";

import { EmailLayout, linkStyle, textStyle } from "@/server/email/templates/email-layout";

interface PasswordLinkEmailProps {
  name: string;
  link: string;
  /** An invitation to a new account, or a reset for an existing one. */
  kind: "INVITATION" | "RESET";
}

const COPY = {
  INVITATION: {
    preview: "You have been invited to the OEDF staff portal.",
    heading: "You have been invited to the staff portal",
    intro:
      "An account has been created for you on the OEDF staff portal. Set your password to sign in:",
  },
  RESET: {
    preview: "Reset your OEDF staff portal password.",
    heading: "Reset your password",
    intro: "We received a request to reset your staff portal password. Choose a new one here:",
  },
} as const;

/** Sent to staff to set a first password or to reset a forgotten one. The link works once. */
export function PasswordLinkEmail({ name, link, kind }: PasswordLinkEmailProps) {
  const copy = COPY[kind];
  return (
    <EmailLayout preview={copy.preview} heading={copy.heading}>
      <Text style={textStyle}>Dear {name},</Text>
      <Text style={textStyle}>{copy.intro}</Text>
      <Text style={textStyle}>
        <Link href={link} style={linkStyle}>
          {link}
        </Link>
      </Text>
      <Text style={textStyle}>
        The link works for 24 hours and only once.{" "}
        {kind === "RESET" ? "If you did not ask for this, you can ignore this email." : ""}
      </Text>
    </EmailLayout>
  );
}
