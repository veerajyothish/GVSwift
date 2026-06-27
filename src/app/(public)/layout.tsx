import React from "react";
import { Footer } from "@/components/ui/Footer";
import LoginBanner from "@/components/ui/LoginBanner";
import { WishlistProvider } from "@/context/WishlistContext";
import { headers } from "next/headers";

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