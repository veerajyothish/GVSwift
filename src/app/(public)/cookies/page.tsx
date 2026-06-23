import React from "react";
import { Navbar } from "@/components/ui/Navbar";

export const metadata = {
  title: "Cookie Policy | GVSwift",
  description: "Learn about how GVSwift utilizes cookies and user data tracking.",
};

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-default">
      <Navbar />
      <main className="container-sm text-primary">
        <h1 className="text-3xl legal-title">
          Cookie Policy
        </h1>
        <p className="text-secondary mb-20">
          Last Updated: June 22, 2026
        </p>

        <section className="legal-section">
          <h2 className="text-xl font-semibold legal-section-title">
            1. What Are Cookies?
          </h2>
          <p className="legal-text">
            Cookies are small text files stored on your device when you load web pages. We use cookies to enable core site functionality (such as cart persistence and user authentication sessions) and to collect performance analytics.
          </p>
        </section>

        <section className="legal-section">
          <h2 className="text-xl font-semibold legal-section-title">
            2. Types of Cookies We Use
          </h2>
          <p className="legal-text mb-8">
            We classify our cookies into the following categories:
          </p>
          <ul className="legal-list">
            <li><strong>Strictly Necessary Cookies</strong>: Essential for secure authentication (Supabase Auth sessions), CSRF protections, and shopping cart persistence. These cannot be disabled.</li>
            <li><strong>Performance &amp; Analytics Cookies</strong>: We use Google Analytics 4 (GA4) to track user traffic patterns and optimize site speed. These are disabled by default until you grant consent.</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2 className="text-xl font-semibold legal-section-title">
            3. Analytics Tracking (GA4)
          </h2>
          <p className="legal-text">
            In compliance with privacy standards, Google Analytics 4 tracking scripts are prevented from loading or making network requests until you explicitly click &quot;Accept&quot; on our cookie consent banner. If you choose to decline, no performance/analytics cookies are placed, and your experience is unaffected.
          </p>
        </section>

        <section className="legal-section">
          <h2 className="text-xl font-semibold legal-section-title">
            4. Managing Cookies in Browser
          </h2>
          <p className="legal-text">
            You can restrict or block cookies through your browser settings. However, disabling strictly necessary cookies will prevent you from logging in, maintaining a shopping cart, or completing checkouts `[TO BE FILLED BY LEGAL]`.
          </p>
        </section>

        <section className="legal-section">
          <h2 className="text-xl font-semibold legal-section-title">
            5. Inquiries
          </h2>
          <p className="legal-text">
            For questions about our cookie policy, please contact us at:
            <br />
            <strong>Email</strong>: <a href="mailto:gvswift.help@gmail.com" className="text-accent">gvswift.help@gmail.com</a>
          </p>
        </section>
      </main>
    </div>
  );
}
