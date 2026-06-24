import React from "react";
import { Footer } from "@/components/ui/Footer";
import LoginBanner from "@/components/ui/LoginBanner";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <LoginBanner />
      <div className="flex-1">{children}</div>
      <Footer />
    </div>
  );
}
