import React from "react";
import { Navbar } from "@/components/ui/Navbar";
import { Footer } from "@/components/ui/Footer";
import AccountSidebar from "./AccountSidebar";
import { requireUser } from "@/lib/auth/guards";

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Guard the entire /account route
  await requireUser();

  return (
    <div className="min-h-screen flex flex-col bg-default">
      <Navbar />
      
      <div className="flex-1">
        <div className="account-container">
          <AccountSidebar />
          <main>
            {children}
          </main>
        </div>
      </div>

      <Footer />
    </div>
  );
}
