import React from "react";
import { Navbar } from "@/components/ui/Navbar";

export const metadata = {
  title: "Frequently Asked Questions (FAQ) | GVSwift",
  description: "Find answers to common questions about GVSwift shipping, payments, and returns.",
};

export default function FaqPage() {
  return (
    <div style={{ backgroundColor: "var(--color-bg)", minHeight: "100vh" }}>
      <Navbar />
      <main style={{ maxWidth: "800px", margin: "0 auto", padding: "40px 20px", color: "var(--color-text-primary)" }}>
        <h1 className="text-3xl" style={{ color: "var(--color-accent)", marginBottom: "24px" }}>
          Frequently Asked Questions (FAQ)
        </h1>
        <p style={{ color: "var(--color-text-secondary)", marginBottom: "30px" }}>
          Quick answers to help you shop with confidence.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          
          <div style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", padding: "20px" }}>
            <h3 style={{ fontSize: "16px", fontWeight: 600, color: "var(--color-accent)", marginBottom: "8px" }}>
              Q: Where does GVSwift deliver?
            </h3>
            <p style={{ fontSize: "14px", lineHeight: "1.6", color: "var(--color-text-primary)", margin: 0 }}>
              A: GVSwift currently operates exclusively within the state of <strong>Andhra Pradesh (AP), India</strong>. Pincode serviceability is verified dynamically during checkout.
            </p>
          </div>

          <div style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", padding: "20px" }}>
            <h3 style={{ fontSize: "16px", fontWeight: 600, color: "var(--color-accent)", marginBottom: "8px" }}>
              Q: What are the Cash on Delivery (COD) limits?
            </h3>
            <p style={{ fontSize: "14px", lineHeight: "1.6", color: "var(--color-text-primary)", margin: 0 }}>
              A: To prevent courier fraud and RTO losses, Cash on Delivery is restricted to a maximum order total of <strong>₹10,000 (1,000,000 Paise)</strong>. Pincodes or accounts marked as high-risk may require manual review/admin confirmation before processing.
            </p>
          </div>

          <div style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", padding: "20px" }}>
            <h3 style={{ fontSize: "16px", fontWeight: 600, color: "var(--color-accent)", marginBottom: "8px" }}>
              Q: How long does shipping and delivery take?
            </h3>
            <p style={{ fontSize: "14px", lineHeight: "1.6", color: "var(--color-text-primary)", margin: 0 }}>
              A: Orders confirmed by our admin team are dispatched within 1-2 business days. Delivery within Andhra Pradesh generally completes in <strong>3-5 business days</strong> post-dispatch.
            </p>
          </div>

          <div style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", padding: "20px" }}>
            <h3 style={{ fontSize: "16px", fontWeight: 600, color: "var(--color-accent)", marginBottom: "8px" }}>
              Q: What is the return window and process?
            </h3>
            <p style={{ fontSize: "14px", lineHeight: "1.6", color: "var(--color-text-primary)", margin: 0 }}>
              A: We offer a <strong>7-day return window</strong> from the date of delivery. You can request a return directly through your order history dashboard. Upon approval, we will arrange a free courier pickup from your delivery address.
            </p>
          </div>

          <div style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", padding: "20px" }}>
            <h3 style={{ fontSize: "16px", fontWeight: 600, color: "var(--color-accent)", marginBottom: "8px" }}>
              Q: How will I receive my refund for a Cash on Delivery order?
            </h3>
            <p style={{ fontSize: "14px", lineHeight: "1.6", color: "var(--color-text-primary)", margin: 0 }}>
              A: Once your returned item passes physical inspection at our warehouse, we will contact you to collect bank details or digital wallet information. Refunds are transferred securely within 5-7 business days `[TO BE FILLED BY LEGAL]`.
            </p>
          </div>

          <div style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", padding: "20px" }}>
            <h3 style={{ fontSize: "16px", fontWeight: 600, color: "var(--color-accent)", marginBottom: "8px" }}>
              Q: How can I contact customer support?
            </h3>
            <p style={{ fontSize: "14px", lineHeight: "1.6", color: "var(--color-text-primary)", margin: 0 }}>
              A: You can open a ticket in our <a href="/support" style={{ color: "var(--color-accent)", fontWeight: 500 }}>Support Portal</a>. Alternatively, you can email us at <a href="mailto:gvswift.help@gmail.com" style={{ color: "var(--color-accent)" }}>gvswift.help@gmail.com</a>.
            </p>
          </div>

        </div>
      </main>
    </div>
  );
}
