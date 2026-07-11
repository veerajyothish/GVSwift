import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          backgroundColor: "#FDFAF5",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "flex-start",
          padding: "80px",
          borderTop: "8px solid #6B1E2E",
        }}
      >
        <p style={{ color: "#6B6460", fontSize: 28, margin: "0 0 16px" }}>
          Premium Fashion · Cash on Delivery · India
        </p>
        <h1 style={{ color: "#6B1E2E", fontSize: 96, fontFamily: "serif", margin: 0 }}>
          GVSwift
        </h1>
      </div>
    ),
    { ...size }
  );
}
