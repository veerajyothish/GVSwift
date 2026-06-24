import React from "react";
import { Footer } from "@/components/ui/Footer";
import LoginBanner from "@/components/ui/LoginBanner";
import { WishlistProvider } from "@/context/WishlistContext";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <WishlistProvider>
      <div className="flex flex-col min-h-screen">
        <LoginBanner />
        <div className="flex-1">{children}</div>
        <Footer />
      </div>
    </WishlistProvider>
  );
}
