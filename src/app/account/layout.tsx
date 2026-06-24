import React from "react";
import { Navbar } from "@/components/ui/Navbar";
import { Footer } from "@/components/ui/Footer";
import AccountSidebar from "./AccountSidebar";
import { requireUser } from "@/lib/auth/guards";
import { getServerSession } from "@/lib/auth/session";
import { VerificationBanner } from "@/components/ui/VerificationBanner";

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Guard the entire /account route
  const user = await requireUser();
  const session = await getServerSession();
  const isVerified = !!session?.email_confirmed_at;

  return (
    <div className="min-h-screen flex flex-col bg-default">
      <Navbar />
      
      <div className="flex-1">
        <div className="account-container">
          <AccountSidebar />
          <main>
            <VerificationBanner email={user.email} isVerified={isVerified} />
            {children}
          </main>
        </div>
      </div>

      <Footer />
    </div>
  );
}
