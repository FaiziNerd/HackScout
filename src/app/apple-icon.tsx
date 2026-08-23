import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#1F1A16",
          color: "#C65A2E",
          fontSize: 72,
          fontWeight: 700,
          letterSpacing: -2,
        }}
      >
        HS
      </div>
    ),
    size,
  );
}
