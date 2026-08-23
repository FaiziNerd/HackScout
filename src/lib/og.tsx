import { ImageResponse } from "next/og";

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

const CREAM = "#F3EEE6";
const INK = "#1F1A16";
const TERRACOTTA = "#C65A2E";
const MUTED = "#6B5E52";

export function createOgImage({
  kicker,
  title,
  description,
  chips = [],
}: {
  kicker: string;
  title: string;
  description?: string;
  chips?: string[];
}) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: INK,
          padding: 18,
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            background: CREAM,
            padding: "48px 56px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                fontSize: 22,
                fontWeight: 700,
                letterSpacing: 4,
                textTransform: "uppercase",
                color: TERRACOTTA,
              }}
            >
              HackScout
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 18,
                letterSpacing: 3,
                textTransform: "uppercase",
                color: MUTED,
              }}
            >
              Pakistan event radar
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                display: "flex",
                fontSize: 20,
                letterSpacing: 4,
                textTransform: "uppercase",
                color: TERRACOTTA,
                marginBottom: 18,
              }}
            >
              {kicker}
            </div>
            <div
              style={{
                display: "flex",
                fontSize: title.length > 48 ? 58 : 72,
                fontWeight: 600,
                lineHeight: 1.05,
                letterSpacing: -2,
                color: INK,
                maxWidth: 1040,
              }}
            >
              {title}
            </div>
            {description ? (
              <div
                style={{
                  display: "flex",
                  marginTop: 22,
                  fontSize: 26,
                  lineHeight: 1.35,
                  color: MUTED,
                  maxWidth: 920,
                }}
              >
                {description}
              </div>
            ) : null}
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <div style={{ display: "flex" }}>
              {chips.filter(Boolean).map((chip) => (
                <div
                  key={chip}
                  style={{
                    display: "flex",
                    marginRight: 12,
                    border: `2px solid ${INK}`,
                    padding: "8px 14px",
                    fontSize: 20,
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: 1,
                    color: INK,
                  }}
                >
                  {chip}
                </div>
              ))}
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 20,
                color: MUTED,
                letterSpacing: 1,
              }}
            >
              hackscout.pk
            </div>
          </div>
        </div>
      </div>
    ),
    { ...OG_SIZE },
  );
}
