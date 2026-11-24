import { Link, Text } from "@react-email/components";

import { absoluteUrl } from "@/lib/seo";
import {
  EmailLayout,
  linkStyle,
  referenceStyle,
  textStyle,
} from "@/server/email/templates/email-layout";

interface ApplicationReceivedEmailProps {
  applicantName: string;
  referenceNumber: string;
  type: "ADMISSION" | "SCHOLARSHIP";
}

export function ApplicationReceivedEmail({
  applicantName,
  referenceNumber,
  type,
}: ApplicationReceivedEmailProps) {
  const noun = type === "ADMISSION" ? "admission" : "scholarship";

  return (
    <EmailLayout
      preview={`We received your ${noun} application. Reference ${referenceNumber}.`}
      heading="We received your application"
    >
      <Text style={textStyle}>Dear {applicantName},</Text>
      <Text style={textStyle}>
        Thank you. We have received your {noun} application. Your reference number is:
      </Text>
      <Text style={referenceStyle}>{referenceNumber}</Text>
      <Text style={textStyle}>
        Keep this number. With the email address you used, it lets you check where your application
        stands at any time:
      </Text>
      <Text style={textStyle}>
        <Link href={absoluteUrl("/application-status")} style={linkStyle}>
          {absoluteUrl("/application-status")}
        </Link>
      </Text>
      <Text style={textStyle}>
        Our team will review your application. If we need anything more from you, we will say so on
        that page.
      </Text>
    </EmailLayout>
  );
}
