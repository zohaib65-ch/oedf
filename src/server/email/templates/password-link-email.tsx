import { Text } from "react-email";

import {
  EmailButton,
  EmailLayout,
  noteStyle,
  textStyle,
} from "@/server/email/templates/email-layout";

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
    action: "Set your password",
    intro:
      "An account has been created for you on the OEDF staff portal. Set your password to sign in.",
  },
  RESET: {
    preview: "Reset your OEDF staff portal password.",
    heading: "Reset your password",
    action: "Reset your password",
    intro: "We received a request to reset your staff portal password. Choose a new one below.",
  },
} as const;

/** Sent to staff to set a first password or to reset a forgotten one. The link works once. */
export function PasswordLinkEmail({ name, link, kind }: PasswordLinkEmailProps) {
  const copy = COPY[kind];
  return (
    <EmailLayout preview={copy.preview} heading={copy.heading}>
      <Text style={textStyle}>Dear {name},</Text>
      <Text style={textStyle}>{copy.intro}</Text>
      <EmailButton href={link}>{copy.action}</EmailButton>
      <Text style={noteStyle}>The button works for 24 hours and only once.</Text>
      {kind === "RESET" ? (
        <Text style={noteStyle}>If you did not ask for this, you can ignore this email.</Text>
      ) : null}
    </EmailLayout>
  );
}
