import React from "react";
import { Navbar } from "@/components/ui/Navbar";

import Link from "next/link";

export const metadata = {
  title: "Returns & Refunds Policy | GVSwift",
  description: "Learn about the return windows, eligible items, and refund process at GVSwift.",
};

export default function ReturnsPage() {
  return (
    <div className="min-h-screen bg-default">
      <Navbar />
      <main className="container-sm text-primary">
        <h1 className="text-3xl legal-title">
          Returns &amp; Refunds Policy
        </h1>
        <p className="text-secondary mb-20">
          Last Updated: June 22, 2026
        </p>

        <section className="legal-section">
          <h2 className="text-xl font-semibold legal-section-title">
            1. 7-Day Return Window
          </h2>
          <p className="legal-text">
            We want you to be completely satisfied with your purchase. GVSwift offers a **7-day return window** starting from the date the order status is marked as `DELIVERED`. Return requests submitted after this 7-day window will be rejected.
          </p>
        </section>

        <section className="legal-section">
          <h2 className="text-xl font-semibold legal-section-title">
            2. Item Eligibility Criteria
          </h2>
          <p className="legal-text mb-8">
            To qualify for a return and refund, items must satisfy the following conditions:
          </p>
          <ul className="legal-list">
            <li>Unworn, unwashed, and undamaged, with all original tags intact.</li>
            <li>In their original packaging.</li>
            <li>Certain categories (such as innerwear or custom-altered items) are non-returnable `[TO BE FILLED BY LEGAL]`.</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2 className="text-xl font-semibold legal-section-title">
            3. Valid Reasons for Returns
          </h2>
          <p className="legal-text mb-8">
            Return requests can be initiated from your Order History page for the following valid reasons:
          </p>
          <ul className="legal-list">
            <li>Incorrect size received (compared to variant selected).</li>
            <li>Defective, damaged, or torn merchandise.</li>
            <li>Item does not match the product listing description.</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2 className="text-xl font-semibold legal-section-title">
            4. Return Pickup Process
          </h2>
          <p className="legal-text">
            Once a return request is submitted, it transitions to `RETURN_REQUESTED`. An admin will review the request and, upon approval, coordinate a merchant-paid pickup at the delivery address. Return logistics cost is covered by us for valid approved returns.
          </p>
        </section>

        <section className="legal-section">
          <h2 className="text-xl font-semibold legal-section-title">
            5. Refund Method and Timelines
          </h2>
          <p className="legal-text">
            Refunds for verified COD orders will be processed within 5-7 business days after the returned product passes quality inspection at our warehouse. Since orders are paid via COD, we will contact you to collect bank details or digital wallet information for secure transfer `[TO BE FILLED BY LEGAL]`. All refunds are computed with precise Paise accuracy.
          </p>
        </section>

        <section className="legal-section">
          <h2 className="text-xl font-semibold legal-section-title">
            6. Contact Support
          </h2>
          <p className="legal-text">
            For help with returns, please open a ticket on our <Link href="/support" className="text-accent font-medium">Support Portal</Link> or email:
            <br />
            <strong>Email</strong>: <a href="mailto:gvswift.help@gmail.com" className="text-accent">gvswift.help@gmail.com</a>
          </p>
        </section>
      </main>
    </div>
  );
}
