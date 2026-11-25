import { Text } from "react-email";

import { absoluteUrl } from "@/lib/seo";
import { EmailButton, EmailLayout, textStyle } from "@/server/email/templates/email-layout";

interface ApplicationIncompleteEmailProps {
  applicantName: string;
  referenceNumber: string;
  missingItems: readonly string[];
}

/** Tells the applicant what to send, and where to upload it. */
export function ApplicationIncompleteEmail({
  applicantName,
  referenceNumber,
  missingItems,
}: ApplicationIncompleteEmailProps) {
  const statusUrl = absoluteUrl("/application-status");
  return (
    <EmailLayout
      preview={`We need more documents for application ${referenceNumber}.`}
      heading="We need a little more from you"
    >
      <Text style={textStyle}>Dear {applicantName},</Text>
      <Text style={textStyle}>
        To continue reviewing application {referenceNumber}, we need the following:
      </Text>
      <Text style={textStyle}>
        {missingItems.map((item) => (
          <span key={item}>
            • {item}
            <br />
          </span>
        ))}
      </Text>
      <Text style={textStyle}>
        Upload them on the application status page, using your reference number and this email
        address.
      </Text>
      <EmailButton href={statusUrl}>Upload your documents</EmailButton>
    </EmailLayout>
  );
}
