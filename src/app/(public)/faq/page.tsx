import React from "react";
import { Navbar } from "@/components/ui/Navbar";

import Link from "next/link";

export const metadata = {
  title: "Frequently Asked Questions (FAQ) | GVSwift",
  description: "Find answers to common questions about GVSwift shipping, payments, and returns.",
};

export default function FaqPage() {
  return (
    <div className="min-h-screen bg-default">
      <Navbar />
      <main className="container-sm text-primary">
        <h1 className="text-3xl legal-title">
          Frequently Asked Questions (FAQ)
        </h1>
        <p className="text-secondary mb-32">
          Quick answers to help you shop with confidence.
        </p>

        <div className="flex flex-col gap-4">
          
          <div className="card p-5">
            <h3 className="text-base font-semibold text-accent mb-8">
              Q: Where does GVSwift deliver?
            </h3>
            <p className="text-sm legal-text margin-0">
              A: GVSwift currently operates exclusively within the state of <strong>Andhra Pradesh (AP), India</strong>. Pincode serviceability is verified dynamically during checkout.
            </p>
          </div>

          <div className="card p-5">
            <h3 className="text-base font-semibold text-accent mb-8">
              Q: What are the Cash on Delivery (COD) limits?
            </h3>
            <p className="text-sm legal-text margin-0">
              A: To prevent courier fraud and RTO losses, Cash on Delivery is restricted to a maximum order total of <strong>₹10,000 (1,000,000 Paise)</strong>. Pincodes or accounts marked as high-risk may require manual review/admin confirmation before processing.
            </p>
          </div>

          <div className="card p-5">
            <h3 className="text-base font-semibold text-accent mb-8">
              Q: How long does shipping and delivery take?
            </h3>
            <p className="text-sm legal-text margin-0">
              A: Orders confirmed by our admin team are dispatched within 1-2 business days. Delivery within Andhra Pradesh generally completes in <strong>3-5 business days</strong> post-dispatch.
            </p>
          </div>

          <div className="card p-5">
            <h3 className="text-base font-semibold text-accent mb-8">
              Q: What is the return window and process?
            </h3>
            <p className="text-sm legal-text margin-0">
              A: We offer a <strong>7-day return window</strong> from the date of delivery. You can request a return directly through your order history dashboard. Upon approval, we will arrange a free courier pickup from your delivery address.
            </p>
          </div>

          <div className="card p-5">
            <h3 className="text-base font-semibold text-accent mb-8">
              Q: How will I receive my refund for a Cash on Delivery order?
            </h3>
            <p className="text-sm legal-text margin-0">
              A: Once your returned item passes physical inspection at our warehouse, we will contact you to collect bank details or digital wallet information. Refunds are transferred securely within 5-7 business days `[TO BE FILLED BY LEGAL]`.
            </p>
          </div>

          <div className="card p-5">
            <h3 className="text-base font-semibold text-accent mb-8">
              Q: How can I contact customer support?
            </h3>
            <p className="text-sm legal-text margin-0">
              A: You can open a ticket in our <Link href="/support" className="text-accent font-medium">Support Portal</Link>. Alternatively, you can email us at <a href="mailto:gvswift.help@gmail.com" className="text-accent">gvswift.help@gmail.com</a>.
            </p>
          </div>

        </div>
      </main>
    </div>
  );
}
