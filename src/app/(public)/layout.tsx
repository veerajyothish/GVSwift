import React from "react";
import dynamic from "next/dynamic";
import LoginBanner from "@/components/ui/LoginBanner";
import { WishlistProvider } from "@/context/WishlistContext";
import { headers } from "next/headers";

/**
 * Lazy-load Footer with ssr:false so it doesn't block the initial HTML render.
 * The footer is below the fold — users see the page content instantly,
 * and the footer hydrates after the critical path is done.
 */
const Footer = dynamic(
  () => import("@/components/ui/Footer").then((m) => ({ default: m.Footer })),
  {
    loading: () => (
      <div
        style={{
          background: "var(--color-surface)",
          borderTop: "1px solid var(--color-border)",
          height: "340px",
        }}
      />
    ),
  }
);

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") || "";
  const showFooter = pathname !== "/checkout";

  return (
    <WishlistProvider>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          minHeight: "100vh",
          background: "var(--color-bg)",
        }}
      >
        <LoginBanner />
        <div style={{ flex: 1 }}>{children}</div>
        {showFooter && <Footer />}
      </div>
    </WishlistProvider>
  );
}