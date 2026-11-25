import { Text } from "react-email";

import { EmailLayout, referenceStyle, textStyle } from "@/server/email/templates/email-layout";

interface JobApplicationReceivedEmailProps {
  candidateName: string;
  vacancyTitle: string;
  referenceNumber: string;
}

export function JobApplicationReceivedEmail({
  candidateName,
  vacancyTitle,
  referenceNumber,
}: JobApplicationReceivedEmailProps) {
  return (
    <EmailLayout
      preview={`We received your application for ${vacancyTitle}.`}
      heading="We received your application"
    >
      <Text style={textStyle}>Dear {candidateName},</Text>
      <Text style={textStyle}>
        Thank you for applying for <strong>{vacancyTitle}</strong>. Your reference number is:
      </Text>
      <Text style={referenceStyle}>{referenceNumber}</Text>
      <Text style={textStyle}>
        Our team will review the applications after the closing date. We will contact you if you are
        shortlisted.
      </Text>
    </EmailLayout>
  );
}
