import { Link, Text } from "react-email";

import { absoluteUrl } from "@/lib/seo";
import { EmailLayout, linkStyle, textStyle } from "@/server/email/templates/email-layout";

interface ApplicationDecisionEmailProps {
  applicantName: string;
  referenceNumber: string;
  type: "ADMISSION" | "SCHOLARSHIP";
  isApproved: boolean;
}

/**
 * The final decision. The staff's reason is internal and is not included; the applicant can
 * contact the office for more information (draft wording, docs/open-questions.md).
 */
export function ApplicationDecisionEmail({
  applicantName,
  referenceNumber,
  type,
  isApproved,
}: ApplicationDecisionEmailProps) {
  const noun = type === "ADMISSION" ? "admission" : "scholarship";
  const contactUrl = absoluteUrl("/contact");
  return (
    <EmailLayout
      preview={`A decision on your ${noun} application ${referenceNumber}.`}
      heading={isApproved ? "Your application was approved" : "A decision on your application"}
    >
      <Text style={textStyle}>Dear {applicantName},</Text>
      {isApproved ? (
        <Text style={textStyle}>
          We are pleased to tell you that your {noun} application {referenceNumber} has been
          approved. Our team will contact you soon about the next steps.
        </Text>
      ) : (
        <Text style={textStyle}>
          Thank you for applying. After careful review, your {noun} application {referenceNumber}{" "}
          was not successful this time.
        </Text>
      )}
      <Text style={textStyle}>
        If you have questions, contact us:{" "}
        <Link href={contactUrl} style={linkStyle}>
          {contactUrl}
        </Link>
      </Text>
    </EmailLayout>
  );
}
