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
      <div className="flex flex-col min-h-screen">
        <LoginBanner />
        <div className="flex-1">{children}</div>
        {showFooter && <Footer />}
      </div>
    </WishlistProvider>
  );
}
