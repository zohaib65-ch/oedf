import { Text } from "@react-email/components";

import { EmailLayout, textStyle } from "@/server/email/templates/email-layout";

interface ContactMessageEmailProps {
  departmentName: string;
  name: string;
  email: string;
  phone: string;
  subjectLabel: string;
  message: string;
}

/** Sent to the office a contact message is routed to. Replying goes to the sender. */
export function ContactMessageEmail({
  departmentName,
  name,
  email,
  phone,
  subjectLabel,
  message,
}: ContactMessageEmailProps) {
  return (
    <EmailLayout
      preview={`New message for ${departmentName}: ${subjectLabel}`}
      heading={`New message for ${departmentName}`}
    >
      <Text style={textStyle}>
        <strong>From:</strong> {name} ({email}){phone ? `, ${phone}` : ""}
        <br />
        <strong>Subject:</strong> {subjectLabel}
      </Text>
      <Text style={{ ...textStyle, whiteSpace: "pre-wrap" }}>{message}</Text>
      <Text style={textStyle}>The message is also saved in the portal inbox.</Text>
    </EmailLayout>
  );
}
