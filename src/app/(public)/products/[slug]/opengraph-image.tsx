import { ImageResponse } from "next/og";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs"; // ← required: Prisma cannot run on Edge
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OGImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await prisma.product.findUnique({
    where: { slug },
    select: { name: true },
  });

  const title = product?.name ?? "GVSwift";

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
        <p style={{ color: "#6B6460", fontSize: 28, margin: "0 0 16px" }}>GVSwift</p>
        <h1 style={{ color: "#6B1E2E", fontSize: 72, fontFamily: "serif", margin: 0 }}>
          {title}
        </h1>
      </div>
    ),
    { ...size }
  );
}
