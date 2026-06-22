import React from "react";
import { Navbar } from "@/components/ui/Navbar";

export const metadata = {
  title: "Privacy Policy | GVSwift",
  description: "Learn how GVSwift collects, stores, and protects user data.",
};

export default function PrivacyPage() {
  return (
    <div style={{ backgroundColor: "var(--color-bg)", minHeight: "100vh" }}>
      <Navbar />
      <main style={{ maxWidth: "800px", margin: "0 auto", padding: "40px 20px", color: "var(--color-text-primary)" }}>
        <h1 className="text-3xl" style={{ color: "var(--color-accent)", marginBottom: "24px" }}>
          Privacy Policy
        </h1>
        <p style={{ color: "var(--color-text-secondary)", marginBottom: "20px" }}>
          Last Updated: June 22, 2026
        </p>

        <section style={{ marginBottom: "24px" }}>
          <h2 className="text-xl font-semibold" style={{ marginBottom: "12px", borderBottom: "1px solid var(--color-border)", paddingBottom: "6px" }}>
            1. Overview
          </h2>
          <p style={{ lineHeight: "1.6" }}>
            GVSwift (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) operates the GVSwift platform. This Privacy Policy details how we collect, use, disclose, and protect personal information of visitors, users, and customers.
          </p>
        </section>

        <section style={{ marginBottom: "24px" }}>
          <h2 className="text-xl font-semibold" style={{ marginBottom: "12px", borderBottom: "1px solid var(--color-border)", paddingBottom: "6px" }}>
            2. Information We Collect
          </h2>
          <p style={{ lineHeight: "1.6", marginBottom: "8px" }}>
            We collect the following personal data to process orders and improve user experience:
          </p>
          <ul style={{ paddingLeft: "20px", lineHeight: "1.6" }}>
            <li><strong>Contact Information</strong>: Email address, phone number, and delivery/shipping addresses.</li>
            <li><strong>Account Credentials</strong>: Secure authentication tokens handled directly via Supabase Auth.</li>
            <li><strong>Usage Information</strong>: Browser details, page views, and actions analyzed anonymously using Google Analytics 4 (GA4).</li>
          </ul>
        </section>

        <section style={{ marginBottom: "24px" }}>
          <h2 className="text-xl font-semibold" style={{ marginBottom: "12px", borderBottom: "1px solid var(--color-border)", paddingBottom: "6px" }}>
            3. Purpose of Collection
          </h2>
          <p style={{ lineHeight: "1.6", marginBottom: "8px" }}>
            We use your personal data for the following purposes:
          </p>
          <ul style={{ paddingLeft: "20px", lineHeight: "1.6" }}>
            <li>Processing, packing, confirming, and delivering Cash on Delivery (COD) orders.</li>
            <li>Fraud prevention and risk assessment (including pincode and phone risk scoring).</li>
            <li>Sending critical transactional notifications (welcome mail, order updates).</li>
          </ul>
        </section>

        <section style={{ marginBottom: "24px" }}>
          <h2 className="text-xl font-semibold" style={{ marginBottom: "12px", borderBottom: "1px solid var(--color-border)", paddingBottom: "6px" }}>
            4. Data Sharing and Transfer
          </h2>
          <p style={{ lineHeight: "1.6", marginBottom: "8px" }}>
            We do not sell your personal data. We share relevant data only with trusted partners for essential services:
          </p>
          <ul style={{ paddingLeft: "20px", lineHeight: "1.6" }}>
            <li><strong>Logistics Partners</strong>: Shared name, address, and phone number for delivery fulfillment.</li>
            <li><strong>Analytics Providers</strong>: Anonymous usage cookies via Google Analytics 4 (GA4) subject to cookie consent banner acceptance.</li>
            <li><strong>Payment Services</strong>: Reserved for future prepaid payment gateways `[TO BE FILLED BY LEGAL]`.</li>
          </ul>
        </section>

        <section style={{ marginBottom: "24px" }}>
          <h2 className="text-xl font-semibold" style={{ marginBottom: "12px", borderBottom: "1px solid var(--color-border)", paddingBottom: "6px" }}>
            5. Data Retention Policy
          </h2>
          <p style={{ lineHeight: "1.6" }}>
            We retain account data as long as the account is active. Order histories and associated audit logs are kept indefinitely for tax, accounting, and compliance requirements. Upon account closure requests, personal identifiers are anonymized or scrubbed, subject to legal limits `[TO BE FILLED BY LEGAL]`.
          </p>
        </section>

        <section style={{ marginBottom: "24px" }}>
          <h2 className="text-xl font-semibold" style={{ marginBottom: "12px", borderBottom: "1px solid var(--color-border)", paddingBottom: "6px" }}>
            6. Security and Consent
          </h2>
          <p style={{ lineHeight: "1.6" }}>
            We implement strict technical controls (such as HTTPS, secure password hashing, and access-control guards) to prevent unauthorized access. By using GVSwift, you consent to the storage and collection of your information in accordance with this policy.
          </p>
        </section>

        <section style={{ marginBottom: "24px" }}>
          <h2 className="text-xl font-semibold" style={{ marginBottom: "12px", borderBottom: "1px solid var(--color-border)", paddingBottom: "6px" }}>
            7. Contact and Grievances
          </h2>
          <p style={{ lineHeight: "1.6" }}>
            For privacy inquiries or grievance redressal, please contact our Grievance Officer:
            <br />
            <strong>Email</strong>: <a href="mailto:gvswift.help@gmail.com" style={{ color: "var(--color-accent)" }}>gvswift.help@gmail.com</a>
            <br />
            <strong>Officer Name &amp; Address</strong>: `[TO BE FILLED]`
          </p>
        </section>
      </main>
    </div>
  );
}
