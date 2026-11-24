import { readFile } from "node:fs/promises";
import path from "node:path";

import { ImageResponse } from "next/og";

import { SITE_NAME } from "@/lib/constants/site";

export const OG_SIZE = { width: 1200, height: 630 } as const;
export const OG_CONTENT_TYPE = "image/png";

// Image rendering cannot read CSS variables, so these repeat the design tokens in globals.css
// (navy-deep, navy, gold, gold-light, logo-plate).
const COLORS = {
  background: "#08111f",
  card: "#0b1120",
  gold: "#c9a355",
  text: "#ffffff",
  muted: "#d1d5dc",
  plate: "#fefefe",
} as const;

const LOGO_PATH = path.join(process.cwd(), "public", "brand", "logo-full.jpeg");
const MAX_TITLE_LENGTH = 110;

interface OgImageInput {
  /** A small label above the title, such as "News". */
  eyebrow: string;
  title: string;
}

/** The share image for a page: the logo on a white plate, a label and the page title on navy. */
export async function renderOgImage({ eyebrow, title }: OgImageInput): Promise<ImageResponse> {
  const logo = `data:image/jpeg;base64,${(await readFile(LOGO_PATH)).toString("base64")}`;
  const shortTitle =
    title.length > MAX_TITLE_LENGTH ? `${title.slice(0, MAX_TITLE_LENGTH - 1)}…` : title;

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 72,
        background: COLORS.background,
        borderTop: `12px solid ${COLORS.gold}`,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
        <div
          style={{
            display: "flex",
            background: COLORS.plate,
            borderRadius: 20,
            padding: 12,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- ImageResponse renders plain img elements. */}
          <img src={logo} alt="" width={170} height={95} />
        </div>
        <div style={{ color: COLORS.muted, fontSize: 30, fontWeight: 600 }}>{SITE_NAME}</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <div
          style={{
            color: COLORS.gold,
            fontSize: 30,
            fontWeight: 700,
            letterSpacing: 4,
            textTransform: "uppercase",
          }}
        >
          {eyebrow}
        </div>
        <div style={{ color: COLORS.text, fontSize: 68, fontWeight: 800, lineHeight: 1.1 }}>
          {shortTitle}
        </div>
      </div>
    </div>,
    OG_SIZE,
  );
}
