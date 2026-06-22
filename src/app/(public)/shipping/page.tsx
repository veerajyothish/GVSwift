import React from "react";
import { Navbar } from "@/components/ui/Navbar";

export const metadata = {
  title: "Shipping Policy | GVSwift",
  description: "Learn about GVSwift's shipping zones, timelines, and Cash on Delivery rules.",
};

export default function ShippingPage() {
  return (
    <div style={{ backgroundColor: "var(--color-bg)", minHeight: "100vh" }}>
      <Navbar />
      <main style={{ maxWidth: "800px", margin: "0 auto", padding: "40px 20px", color: "var(--color-text-primary)" }}>
        <h1 className="text-3xl" style={{ color: "var(--color-accent)", marginBottom: "24px" }}>
          Shipping &amp; Delivery Policy
        </h1>
        <p style={{ color: "var(--color-text-secondary)", marginBottom: "20px" }}>
          Last Updated: June 22, 2026
        </p>

        <section style={{ marginBottom: "24px" }}>
          <h2 className="text-xl font-semibold" style={{ marginBottom: "12px", borderBottom: "1px solid var(--color-border)", paddingBottom: "6px" }}>
            1. Geographic Serviceability
          </h2>
          <p style={{ lineHeight: "1.6" }}>
            At launch, GVSwift operates exclusively within **Andhra Pradesh (AP), India**. Delivery is limited to pincodes that are registered as active and serviceable in our database. You can verify your address's serviceability at checkout. Orders with pincodes outside our service zone will be rejected.
          </p>
        </section>

        <section style={{ marginBottom: "24px" }}>
          <h2 className="text-xl font-semibold" style={{ marginBottom: "12px", borderBottom: "1px solid var(--color-border)", paddingBottom: "6px" }}>
            2. Cash on Delivery (COD) Rules
          </h2>
          <p style={{ lineHeight: "1.6", marginBottom: "8px" }}>
            Our standard payment method is Cash on Delivery (COD) subject to the following controls:
          </p>
          <ul style={{ paddingLeft: "20px", lineHeight: "1.6" }}>
            <li><strong>COD Order Limit</strong>: Order total cannot exceed ₹10,000 (1,000,000 Paise).</li>
            <li><strong>COD Fee</strong>: We do not charge additional fees for COD orders (₹0).</li>
            <li><strong>Verification</strong>: Orders from high-risk accounts or pincodes may require manual verification/admin approval before confirmation.</li>
          </ul>
        </section>

        <section style={{ marginBottom: "24px" }}>
          <h2 className="text-xl font-semibold" style={{ marginBottom: "12px", borderBottom: "1px solid var(--color-border)", paddingBottom: "6px" }}>
            3. Dispatch and Delivery Timelines
          </h2>
          <p style={{ lineHeight: "1.6" }}>
            Orders are confirmed by our admin team within 24 hours of placement. Standard dispatch takes **1-2 business days** from confirmation. Delivery typically completes within **3-5 business days** post-dispatch.
          </p>
        </section>

        <section style={{ marginBottom: "24px" }}>
          <h2 className="text-xl font-semibold" style={{ marginBottom: "12px", borderBottom: "1px solid var(--color-border)", paddingBottom: "6px" }}>
            4. Delivery Attempt Guidelines
          </h2>
          <p style={{ lineHeight: "1.6" }}>
            Our courier partners will make a **maximum of 2 delivery attempts**. If the customer is unreachable or refuses delivery after 2 attempts, the package is returned to origin (RTO) and marked as `RTO`. Repeated delivery failures will result in the suspension of COD privileges.
          </p>
        </section>

        <section style={{ marginBottom: "24px" }}>
          <h2 className="text-xl font-semibold" style={{ marginBottom: "12px", borderBottom: "1px solid var(--color-border)", paddingBottom: "6px" }}>
            5. Force Majeure &amp; Delays
          </h2>
          <p style={{ lineHeight: "1.6" }}>
            We strive to meet all delivery timelines. However, GVSwift is not liable for shipping delays caused by natural disasters, strikes, civil disturbances, or other unforeseen events outside of our reasonable control `[TO BE FILLED BY LEGAL]`.
          </p>
        </section>

        <section style={{ marginBottom: "24px" }}>
          <h2 className="text-xl font-semibold" style={{ marginBottom: "12px", borderBottom: "1px solid var(--color-border)", paddingBottom: "6px" }}>
            6. Inquiries
          </h2>
          <p style={{ lineHeight: "1.6" }}>
            For delivery status questions, you can view your order tracking reference in the Order Details page or email:
            <br />
            <strong>Email</strong>: <a href="mailto:gvswift.help@gmail.com" style={{ color: "var(--color-accent)" }}>gvswift.help@gmail.com</a>
          </p>
        </section>
      </main>
    </div>
  );
}
