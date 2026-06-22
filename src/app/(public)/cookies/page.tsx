import React from "react";
import { Navbar } from "@/components/ui/Navbar";

export const metadata = {
  title: "Cookie Policy | GVSwift",
  description: "Learn about how GVSwift utilizes cookies and user data tracking.",
};

export default function CookiesPage() {
  return (
    <div style={{ backgroundColor: "var(--color-bg)", minHeight: "100vh" }}>
      <Navbar />
      <main style={{ maxWidth: "800px", margin: "0 auto", padding: "40px 20px", color: "var(--color-text-primary)" }}>
        <h1 className="text-3xl" style={{ color: "var(--color-accent)", marginBottom: "24px" }}>
          Cookie Policy
        </h1>
        <p style={{ color: "var(--color-text-secondary)", marginBottom: "20px" }}>
          Last Updated: June 22, 2026
        </p>

        <section style={{ marginBottom: "24px" }}>
          <h2 className="text-xl font-semibold" style={{ marginBottom: "12px", borderBottom: "1px solid var(--color-border)", paddingBottom: "6px" }}>
            1. What Are Cookies?
          </h2>
          <p style={{ lineHeight: "1.6" }}>
            Cookies are small text files stored on your device when you load web pages. We use cookies to enable core site functionality (such as cart persistence and user authentication sessions) and to collect performance analytics.
          </p>
        </section>

        <section style={{ marginBottom: "24px" }}>
          <h2 className="text-xl font-semibold" style={{ marginBottom: "12px", borderBottom: "1px solid var(--color-border)", paddingBottom: "6px" }}>
            2. Types of Cookies We Use
          </h2>
          <p style={{ lineHeight: "1.6", marginBottom: "8px" }}>
            We classify our cookies into the following categories:
          </p>
          <ul style={{ paddingLeft: "20px", lineHeight: "1.6" }}>
            <li><strong>Strictly Necessary Cookies</strong>: Essential for secure authentication (Supabase Auth sessions), CSRF protections, and shopping cart persistence. These cannot be disabled.</li>
            <li><strong>Performance &amp; Analytics Cookies</strong>: We use Google Analytics 4 (GA4) to track user traffic patterns and optimize site speed. These are disabled by default until you grant consent.</li>
          </ul>
        </section>

        <section style={{ marginBottom: "24px" }}>
          <h2 className="text-xl font-semibold" style={{ marginBottom: "12px", borderBottom: "1px solid var(--color-border)", paddingBottom: "6px" }}>
            3. Analytics Tracking (GA4)
          </h2>
          <p style={{ lineHeight: "1.6" }}>
            In compliance with privacy standards, Google Analytics 4 tracking scripts are prevented from loading or making network requests until you explicitly click &quot;Accept&quot; on our cookie consent banner. If you choose to decline, no performance/analytics cookies are placed, and your experience is unaffected.
          </p>
        </section>

        <section style={{ marginBottom: "24px" }}>
          <h2 className="text-xl font-semibold" style={{ marginBottom: "12px", borderBottom: "1px solid var(--color-border)", paddingBottom: "6px" }}>
            4. Managing Cookies in Browser
          </h2>
          <p style={{ lineHeight: "1.6" }}>
            You can restrict or block cookies through your browser settings. However, disabling strictly necessary cookies will prevent you from logging in, maintaining a shopping cart, or completing checkouts `[TO BE FILLED BY LEGAL]`.
          </p>
        </section>

        <section style={{ marginBottom: "24px" }}>
          <h2 className="text-xl font-semibold" style={{ marginBottom: "12px", borderBottom: "1px solid var(--color-border)", paddingBottom: "6px" }}>
            5. Inquiries
          </h2>
          <p style={{ lineHeight: "1.6" }}>
            For questions about our cookie policy, please contact us at:
            <br />
            <strong>Email</strong>: <a href="mailto:gvswift.help@gmail.com" style={{ color: "var(--color-accent)" }}>gvswift.help@gmail.com</a>
          </p>
        </section>
      </main>
    </div>
  );
}
