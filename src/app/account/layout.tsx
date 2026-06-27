/**
 * Account Layout — PDF p.8/11/12:
 * Full page: Navbar top, cream bg, two-col grid (sidebar 220px left, main right),
 * Footer bottom. "My Account" heading lives in each child page.
 */
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
  const user = await requireUser();
  const session = await getServerSession();
  const isVerified = !!session?.email_confirmed_at;

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "var(--color-bg)",
      }}
    >
      <Navbar />

      <div style={{ flex: 1 }}>
        {/* PDF p.8: "My Account" + subtitle above the 2-col grid */}
        <div
          style={{
            maxWidth: "1100px",
            margin: "0 auto",
            padding: "48px 24px 0",
          }}
        >
          <h1
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "clamp(32px, 5vw, 48px)",
              fontWeight: 400,
              fontStyle: "italic",
              color: "var(--color-accent)",
              marginBottom: "8px",
            }}
          >
            My Account
          </h1>
          <p
            style={{
              fontSize: "14px",
              color: "var(--color-text-secondary)",
              marginBottom: "40px",
            }}
          >
            Manage your personal details, security settings, and preferences.
          </p>
        </div>

        {/* Two-col layout */}
        <div className="account-container" style={{ paddingTop: 0 }}>
          <AccountSidebar />
          <main style={{ minWidth: 0 }}>
            <VerificationBanner email={user.email} isVerified={isVerified} />
            {children}
          </main>
        </div>
      </div>

      <Footer />
    </div>
  );
}