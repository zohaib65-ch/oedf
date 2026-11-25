import { Text } from "react-email";

import { absoluteUrl } from "@/lib/seo";
import {
  EmailButton,
  EmailLayout,
  referenceStyle,
  textStyle,
} from "@/server/email/templates/email-layout";

interface DirectiveIssuedEmailProps {
  directiveId: string;
  referenceNumber: string;
  title: string;
  officeName: string;
  priorityLabel: string;
  dueLabel: string;
}

/** Sent to the Director of each office a directive is addressed to. The details stay in the portal. */
export function DirectiveIssuedEmail({
  directiveId,
  referenceNumber,
  title,
  officeName,
  priorityLabel,
  dueLabel,
}: DirectiveIssuedEmailProps) {
  const link = absoluteUrl(`/portal/directives/${directiveId}`);
  return (
    <EmailLayout
      preview={`New directive for ${officeName}: ${title}`}
      heading="A new directive for your office"
    >
      <Text style={textStyle}>
        The Research &amp; Policy Institute has issued a directive to {officeName}:
      </Text>
      <Text style={referenceStyle}>{referenceNumber}</Text>
      <Text style={textStyle}>
        <strong>{title}</strong>
        <br />
        Priority: {priorityLabel}
        <br />
        Due: {dueLabel}
      </Text>
      <Text style={textStyle}>
        Please acknowledge it in the portal and name who will carry it out.
      </Text>
      <EmailButton href={link}>Open the directive</EmailButton>
    </EmailLayout>
  );
}
