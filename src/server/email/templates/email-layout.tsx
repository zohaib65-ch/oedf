import type { ReactNode } from "react";
import { Body, Button, Container, Head, Hr, Html, Link, Preview, Section, Text } from "react-email";

import { publicEnv } from "@/env";
import { SECP_REGISTRATION_NUMBER, SITE_NAME } from "@/lib/constants/site";

// Email clients ignore stylesheets and CSS variables, so email styles are inline. These values
// repeat the design tokens (navy, gold, primary button, ink, page) in src/app/globals.css.
const colors = {
  navy: "#0b1120",
  gold: "#846932",
  primary: "#c9a355",
  ink: "#111827",
  muted: "#646b79",
  border: "#e5e7eb",
  page: "#f3f4f6",
  panel: "#f9fafb",
} as const;

const styles = {
  body: {
    backgroundColor: colors.page,
    fontFamily: "Inter, 'Segoe UI', Arial, sans-serif",
    margin: 0,
    padding: "32px 12px",
  },
  container: {
    backgroundColor: "#ffffff",
    border: `1px solid ${colors.border}`,
    borderRadius: 16,
    borderTop: `6px solid ${colors.primary}`,
    margin: "0 auto",
    maxWidth: 560,
    overflow: "hidden",
  },
  header: { padding: "28px 40px 8px", textAlign: "center" },
  brand: {
    color: colors.gold,
    fontSize: 13,
    fontWeight: 700,
    letterSpacing: 1,
    lineHeight: "20px",
    margin: 0,
    textTransform: "uppercase",
  },
  content: { padding: "8px 40px 32px" },
  heading: {
    color: colors.navy,
    fontSize: 24,
    fontWeight: 800,
    lineHeight: "32px",
    margin: "16px 0 16px",
    textAlign: "center",
  },
  footer: { padding: "0 40px 28px", textAlign: "center" },
  footerText: { color: colors.muted, fontSize: 12, lineHeight: "18px", margin: "0 0 4px" },
  footerLink: { color: colors.gold, fontSize: 12, fontWeight: 600, textDecoration: "none" },
} as const;

interface EmailLayoutProps {
  preview: string;
  heading: string;
  children: ReactNode;
}

/** The frame of every email: gold top bar, the foundation's name, heading, content and the foundation's details. */
export function EmailLayout({ preview, heading, children }: EmailLayoutProps) {
  const siteHost = new URL(publicEnv.NEXT_PUBLIC_SITE_URL).host;
  return (
    <Html lang="en">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Section style={styles.header}>
            <Text style={styles.brand}>{SITE_NAME}</Text>
            <Text style={styles.heading}>{heading}</Text>
          </Section>
          <Section style={styles.content}>{children}</Section>
          <Section style={styles.footer}>
            <Hr style={{ borderColor: colors.border, margin: "0 0 24px" }} />
            <Text style={styles.footerText}>
              {SITE_NAME}
              <br />
              SECP Registration No. {SECP_REGISTRATION_NUMBER}
            </Text>
            <Link href={publicEnv.NEXT_PUBLIC_SITE_URL} style={styles.footerLink}>
              {siteHost}
            </Link>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

/** The one action an email asks for, as a gold button in the middle. */
export function EmailButton({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Section style={{ margin: "8px 0 24px", textAlign: "center" }}>
      <Button
        href={href}
        style={{
          backgroundColor: colors.primary,
          borderRadius: 10,
          color: colors.navy,
          display: "inline-block",
          fontSize: 16,
          fontWeight: 700,
          padding: "14px 32px",
          textDecoration: "none",
        }}
      >
        {children}
      </Button>
    </Section>
  );
}

export const textStyle = {
  color: colors.ink,
  fontSize: 15,
  lineHeight: "24px",
  margin: "0 0 16px",
} as const;
export const noteStyle = {
  color: colors.muted,
  fontSize: 13,
  lineHeight: "20px",
  margin: "0 0 8px",
  textAlign: "center",
} as const;
export const referenceStyle = {
  backgroundColor: colors.panel,
  border: `1px solid ${colors.border}`,
  borderRadius: 10,
  color: colors.navy,
  fontSize: 20,
  fontWeight: 800,
  letterSpacing: 1,
  margin: "12px 0 20px",
  padding: "14px 16px",
  textAlign: "center",
} as const;
