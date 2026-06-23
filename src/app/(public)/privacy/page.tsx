import React from "react";
import { Navbar } from "@/components/ui/Navbar";

export const metadata = {
  title: "Privacy Policy | GVSwift",
  description: "Learn how GVSwift collects, stores, and protects user data.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-default">
      <Navbar />
      <main className="container-sm text-primary">
        <h1 className="text-3xl legal-title">
          Privacy Policy
        </h1>
        <p className="text-secondary mb-20">
          Last Updated: June 22, 2026
        </p>

        <section className="legal-section">
          <h2 className="text-xl font-semibold legal-section-title">
            1. Overview
          </h2>
          <p className="legal-text">
            GVSwift (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) operates the GVSwift platform. This Privacy Policy details how we collect, use, disclose, and protect personal information of visitors, users, and customers.
          </p>
        </section>

        <section className="legal-section">
          <h2 className="text-xl font-semibold legal-section-title">
            2. Information We Collect
          </h2>
          <p className="legal-text mb-8">
            We collect the following personal data to process orders and improve user experience:
          </p>
          <ul className="legal-list">
            <li><strong>Contact Information</strong>: Email address, phone number, and delivery/shipping addresses.</li>
            <li><strong>Account Credentials</strong>: Secure authentication tokens handled directly via Supabase Auth.</li>
            <li><strong>Usage Information</strong>: Browser details, page views, and actions analyzed anonymously using Google Analytics 4 (GA4).</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2 className="text-xl font-semibold legal-section-title">
            3. Purpose of Collection
          </h2>
          <p className="legal-text mb-8">
            We use your personal data for the following purposes:
          </p>
          <ul className="legal-list">
            <li>Processing, packing, confirming, and delivering Cash on Delivery (COD) orders.</li>
            <li>Fraud prevention and risk assessment (including pincode and phone risk scoring).</li>
            <li>Sending critical transactional notifications (welcome mail, order updates).</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2 className="text-xl font-semibold legal-section-title">
            4. Data Sharing and Transfer
          </h2>
          <p className="legal-text mb-8">
            We do not sell your personal data. We share relevant data only with trusted partners for essential services:
          </p>
          <ul className="legal-list">
            <li><strong>Logistics Partners</strong>: Shared name, address, and phone number for delivery fulfillment.</li>
            <li><strong>Analytics Providers</strong>: Anonymous usage cookies via Google Analytics 4 (GA4) subject to cookie consent banner acceptance.</li>
            <li><strong>Payment Services</strong>: Reserved for future prepaid payment gateways `[TO BE FILLED BY LEGAL]`.</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2 className="text-xl font-semibold legal-section-title">
            5. Data Retention Policy
          </h2>
          <p className="legal-text">
            We retain account data as long as the account is active. Order histories and associated audit logs are kept indefinitely for tax, accounting, and compliance requirements. Upon account closure requests, personal identifiers are anonymized or scrubbed, subject to legal limits `[TO BE FILLED BY LEGAL]`.
          </p>
        </section>

        <section className="legal-section">
          <h2 className="text-xl font-semibold legal-section-title">
            6. Security and Consent
          </h2>
          <p className="legal-text">
            We implement strict technical controls (such as HTTPS, secure password hashing, and access-control guards) to prevent unauthorized access. By using GVSwift, you consent to the storage and collection of your information in accordance with this policy.
          </p>
        </section>

        <section className="legal-section">
          <h2 className="text-xl font-semibold legal-section-title">
            7. Contact and Grievances
          </h2>
          <p className="legal-text">
            For privacy inquiries or grievance redressal, please contact our Grievance Officer:
            <br />
            <strong>Email</strong>: <a href="mailto:gvswift.help@gmail.com" className="text-accent">gvswift.help@gmail.com</a>
            <br />
            <strong>Officer Name &amp; Address</strong>: `[TO BE FILLED]`
          </p>
        </section>
      </main>
    </div>
  );
}
