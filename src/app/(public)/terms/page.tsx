import React from "react";
import { Navbar } from "@/components/ui/Navbar";

export const metadata = {
  title: "Terms of Service | GVSwift",
  description: "Read the terms and conditions governing the use of GVSwift.",
};

export default function TermsPage() {
  return (
    <div style={{ backgroundColor: "var(--color-bg)", minHeight: "100vh" }}>
      <Navbar />
      <main style={{ maxWidth: "800px", margin: "0 auto", padding: "40px 20px", color: "var(--color-text-primary)" }}>
        <h1 className="text-3xl" style={{ color: "var(--color-accent)", marginBottom: "24px" }}>
          Terms of Service
        </h1>
        <p style={{ color: "var(--color-text-secondary)", marginBottom: "20px" }}>
          Last Updated: June 22, 2026
        </p>

        <section style={{ marginBottom: "24px" }}>
          <h2 className="text-xl font-semibold" style={{ marginBottom: "12px", borderBottom: "1px solid var(--color-border)", paddingBottom: "6px" }}>
            1. Acceptance of Terms
          </h2>
          <p style={{ lineHeight: "1.6" }}>
            By registering an account, placing an order, or accessing the GVSwift platform, you agree to be bound by these Terms of Service. If you do not agree, please do not use our services.
          </p>
        </section>

        <section style={{ marginBottom: "24px" }}>
          <h2 className="text-xl font-semibold" style={{ marginBottom: "12px", borderBottom: "1px solid var(--color-border)", paddingBottom: "6px" }}>
            2. Account Registration and Security
          </h2>
          <p style={{ lineHeight: "1.6" }}>
            To place an order, you must create a registered account. You are responsible for safeguarding your login credentials. Anonymous checkout is not permitted to reduce delivery fraud. We reserve the right to suspend accounts engaged in suspicious or abusive behaviors `[TO BE FILLED BY LEGAL]`.
          </p>
        </section>

        <section style={{ marginBottom: "24px" }}>
          <h2 className="text-xl font-semibold" style={{ marginBottom: "12px", borderBottom: "1px solid var(--color-border)", paddingBottom: "6px" }}>
            3. Order Placement and Contract Formation
          </h2>
          <p style={{ lineHeight: "1.6" }}>
            An order placed on GVSwift constitutes an offer. A contract is formed only when we confirm the order (moving its status from PLACED to CONFIRMED). We reserve the right to decline or cancel orders due to stock unavailability, pricing errors, or high risk/fraud scoring.
          </p>
        </section>

        <section style={{ marginBottom: "24px" }}>
          <h2 className="text-xl font-semibold" style={{ marginBottom: "12px", borderBottom: "1px solid var(--color-border)", paddingBottom: "6px" }}>
            4. Pricing and Payment
          </h2>
          <p style={{ lineHeight: "1.6" }}>
            All prices are shown in Indian Rupees (INR) and calculated internally in Paise. We offer Cash on Delivery (COD) subject to a ₹10,000 order limit and pincode serviceability checks. We reserve the right to correct any pricing errors, cancel corresponding orders, or update limits without prior notice `[TO BE FILLED BY LEGAL]`.
          </p>
        </section>

        <section style={{ marginBottom: "24px" }}>
          <h2 className="text-xl font-semibold" style={{ marginBottom: "12px", borderBottom: "1px solid var(--color-border)", paddingBottom: "6px" }}>
            5. Shipping and Delivery Restrictions
          </h2>
          <p style={{ lineHeight: "1.6" }}>
            GVSwift currently ships **only within Andhra Pradesh (AP)**. We limit delivery attempts to a maximum of 2, after which undelivered orders are returned to origin (RTO) and customer COD privileges may be restricted or suspended.
          </p>
        </section>

        <section style={{ marginBottom: "24px" }}>
          <h2 className="text-xl font-semibold" style={{ marginBottom: "12px", borderBottom: "1px solid var(--color-border)", paddingBottom: "6px" }}>
            6. Returns and Refunds
          </h2>
          <p style={{ lineHeight: "1.6" }}>
            Customer return requests must be submitted within our designated 7-day window post-delivery. Returns are subject to validation checks. Refer to our Returns Policy for full eligibility details.
          </p>
        </section>

        <section style={{ marginBottom: "24px" }}>
          <h2 className="text-xl font-semibold" style={{ marginBottom: "12px", borderBottom: "1px solid var(--color-border)", paddingBottom: "6px" }}>
            7. Limitation of Liability and Governing Law
          </h2>
          <p style={{ lineHeight: "1.6" }}>
            GVSwift is not liable for indirect or consequential damages. These Terms are governed by the laws of India, with exclusive jurisdiction in the courts of Andhra Pradesh `[TO BE FILLED BY LEGAL]`.
          </p>
        </section>

        <section style={{ marginBottom: "24px" }}>
          <h2 className="text-xl font-semibold" style={{ marginBottom: "12px", borderBottom: "1px solid var(--color-border)", paddingBottom: "6px" }}>
            8. Contact Details
          </h2>
          <p style={{ lineHeight: "1.6" }}>
            For queries about our Terms of Service:
            <br />
            <strong>Email</strong>: <a href="mailto:gvswift.help@gmail.com" style={{ color: "var(--color-accent)" }}>gvswift.help@gmail.com</a>
          </p>
        </section>
      </main>
    </div>
  );
}
