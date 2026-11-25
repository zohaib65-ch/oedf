import { Text } from "react-email";

import { absoluteUrl } from "@/lib/seo";
import { EmailButton, EmailLayout, textStyle } from "@/server/email/templates/email-layout";

interface ScholarshipEndedEmailProps {
  applicantName: string;
  referenceNumber: string;
  reason: string;
}

/** Sent when staff delete a scholarship award: the scholarship has ended, and why. */
export function ScholarshipEndedEmail({
  applicantName,
  referenceNumber,
  reason,
}: ScholarshipEndedEmailProps) {
  return (
    <EmailLayout
      preview={`Your scholarship ${referenceNumber} has ended.`}
      heading="Your scholarship has ended"
    >
      <Text style={textStyle}>Dear {applicantName},</Text>
      <Text style={textStyle}>
        We are writing to let you know that your scholarship for application {referenceNumber} has
        ended.
      </Text>
      <Text style={textStyle}>
        <strong>Reason:</strong> {reason}
      </Text>
      <Text style={textStyle}>
        You can see this on the application status page at any time. If you have questions, we are
        happy to help.
      </Text>
      <EmailButton href={absoluteUrl("/contact")}>Contact us</EmailButton>
    </EmailLayout>
  );
}
