import { Link, Text } from "@react-email/components";

import { absoluteUrl } from "@/lib/seo";
import {
  EmailLayout,
  linkStyle,
  referenceStyle,
  textStyle,
} from "@/server/email/templates/email-layout";

interface ClarificationRequestedEmailProps {
  directiveId: string;
  referenceNumber: string;
  title: string;
  officeName: string;
  reasonLabel: string;
}

/** Sent to the CEO Office when an office asks for clarification on a directive. */
export function ClarificationRequestedEmail({
  directiveId,
  referenceNumber,
  title,
  officeName,
  reasonLabel,
}: ClarificationRequestedEmailProps) {
  const link = absoluteUrl(`/portal/directives/${directiveId}`);
  return (
    <EmailLayout
      preview={`${officeName} asks for clarification on ${referenceNumber}`}
      heading="Clarification requested on a directive"
    >
      <Text style={textStyle}>{officeName} has asked the CEO Office to clarify a directive:</Text>
      <Text style={referenceStyle}>{referenceNumber}</Text>
      <Text style={textStyle}>
        <strong>{title}</strong>
        <br />
        Reason: {reasonLabel}
      </Text>
      <Text style={textStyle}>
        Read the explanation and decide whether to reopen or close the office&apos;s part:
      </Text>
      <Text style={textStyle}>
        <Link href={link} style={linkStyle}>
          {link}
        </Link>
      </Text>
    </EmailLayout>
  );
}
