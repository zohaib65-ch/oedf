import type { ReactNode } from "react";
import { Body, Container, Head, Hr, Html, Img, Preview, Section, Text } from "react-email";

import { publicEnv } from "@/env";
import { SECP_REGISTRATION_NUMBER, SITE_NAME } from "@/lib/constants/site";
import { absoluteUrl } from "@/lib/seo";

// Email clients ignore stylesheets and CSS variables, so email styles are inline. These values
// repeat the design tokens (navy, gold, ink, page) in src/app/globals.css.
const colors = {
  navy: "#0b1120",
  gold: "#846932",
  ink: "#111827",
  muted: "#646b79",
  page: "#f9fafb",
} as const;

const styles = {
  body: {
    backgroundColor: colors.page,
    fontFamily: "Inter, Arial, sans-serif",
    margin: 0,
    padding: "24px 0",
  },
  container: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    margin: "0 auto",
    maxWidth: 560,
    padding: "32px",
  },
  heading: { color: colors.navy, fontSize: 22, fontWeight: 800, margin: "24px 0 12px" },
  footer: { color: colors.muted, fontSize: 12, lineHeight: "18px" },
} as const;

interface EmailLayoutProps {
  preview: string;
  heading: string;
  children: ReactNode;
}

/** The frame of every email: logo, heading, content and the foundation's registration line. */
export function EmailLayout({ preview, heading, children }: EmailLayoutProps) {
  return (
    <Html lang="en">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Img
            src={absoluteUrl("/brand/logo-full.jpeg")}
            alt={SITE_NAME}
            width={160}
            style={{ display: "block" }}
          />
          <Text style={styles.heading}>{heading}</Text>
          {children}
          <Hr style={{ borderColor: "#e5e7eb", margin: "24px 0" }} />
          <Section>
            <Text style={styles.footer}>
              {SITE_NAME}. SECP Registration No. {SECP_REGISTRATION_NUMBER}.
              <br />
              {publicEnv.NEXT_PUBLIC_SITE_URL}
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export const textStyle = {
  color: colors.ink,
  fontSize: 15,
  lineHeight: "24px",
  margin: "0 0 12px",
} as const;
export const referenceStyle = {
  backgroundColor: colors.page,
  border: "1px solid #e5e7eb",
  borderRadius: 8,
  color: colors.navy,
  fontSize: 20,
  fontWeight: 800,
  letterSpacing: 1,
  margin: "12px 0 20px",
  padding: "14px 16px",
  textAlign: "center",
} as const;
export const linkStyle = { color: colors.gold, fontWeight: 600 } as const;
