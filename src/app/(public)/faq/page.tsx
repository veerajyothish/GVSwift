import React from "react";
import Link from "next/link";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/motion-primitives/accordion";

export const metadata = {
  title: "Frequently Asked Questions (FAQ) | GVSwift",
  description: "Find answers to common questions about GVSwift shipping, payments, and returns.",
};

export default function FaqPage() {
  return (
    <div className="min-h-screen bg-default">
      <main className="container-sm text-primary">
        <h1 className="text-3xl legal-title">
          Frequently Asked Questions (FAQ)
        </h1>
        <p className="text-secondary mb-32">
          Quick answers to help you shop with confidence.
        </p>

        <Accordion className="flex flex-col gap-4">
          
          <AccordionItem value="q1" className="card overflow-hidden border border-black">
            <AccordionTrigger className="w-full flex items-center justify-between text-left p-5 text-base font-semibold text-accent">
              Q: Where does GVSwift deliver?
            </AccordionTrigger>
            <AccordionContent className="px-5 pb-5 text-sm legal-text margin-0">
              A: GVSwift currently operates exclusively within the state of <strong>Andhra Pradesh (AP), India</strong>. Pincode serviceability is verified dynamically during checkout.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="q2" className="card overflow-hidden border border-black">
            <AccordionTrigger className="w-full flex items-center justify-between text-left p-5 text-base font-semibold text-accent">
              Q: What are the Cash on Delivery (COD) limits?
            </AccordionTrigger>
            <AccordionContent className="px-5 pb-5 text-sm legal-text margin-0">
              A: To prevent courier fraud and RTO losses, Cash on Delivery is restricted to a maximum order total of <strong>₹10,000 (1,000,000 Paise)</strong>. Pincodes or accounts marked as high-risk may require manual review/admin confirmation before processing.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="q3" className="card overflow-hidden border border-black">
            <AccordionTrigger className="w-full flex items-center justify-between text-left p-5 text-base font-semibold text-accent">
              Q: How long does shipping and delivery take?
            </AccordionTrigger>
            <AccordionContent className="px-5 pb-5 text-sm legal-text margin-0">
              A: Orders confirmed by our admin team are dispatched within 1-2 business days. Delivery within Andhra Pradesh generally completes in <strong>3-5 business days</strong> post-dispatch.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="q4" className="card overflow-hidden border border-black">
            <AccordionTrigger className="w-full flex items-center justify-between text-left p-5 text-base font-semibold text-accent">
              Q: What is the return window and process?
            </AccordionTrigger>
            <AccordionContent className="px-5 pb-5 text-sm legal-text margin-0">
              A: We offer a <strong>7-day return window</strong> from the date of delivery. You can request a return directly through your order history dashboard. Upon approval, we will arrange a free courier pickup from your delivery address.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="q5" className="card overflow-hidden border border-black">
            <AccordionTrigger className="w-full flex items-center justify-between text-left p-5 text-base font-semibold text-accent">
              Q: How will I receive my refund for a Cash on Delivery order?
            </AccordionTrigger>
            <AccordionContent className="px-5 pb-5 text-sm legal-text margin-0">
              A: Once your returned item passes physical inspection at our warehouse, we will contact you to collect bank details or digital wallet information. Refunds are transferred securely within 5-7 business days `[TO BE FILLED BY LEGAL]`.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="q6" className="card overflow-hidden border border-black">
            <AccordionTrigger className="w-full flex items-center justify-between text-left p-5 text-base font-semibold text-accent">
              Q: How can I contact customer support?
            </AccordionTrigger>
            <AccordionContent className="px-5 pb-5 text-sm legal-text margin-0">
              A: You can open a ticket in our <Link href="/support" className="text-accent font-medium">Support Portal</Link>. Alternatively, you can email us at <a href="mailto:support@gvswift.com" className="text-accent">support@gvswift.com</a>.
            </AccordionContent>
          </AccordionItem>

        </Accordion>
      </main>
    </div>
  );
}
