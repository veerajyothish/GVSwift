import React from "react";
import { Navbar } from "@/components/ui/Navbar";

export const metadata = {
  title: "Disclaimer | GVSwift",
  description: "Read GVSwift's legal disclaimer regarding product representations and liability limits.",
};

export default function DisclaimerPage() {
  return (
    <div className="min-h-screen bg-default">
      <Navbar />
      <main className="container-sm text-primary">
        <h1 className="text-3xl legal-title">
          Disclaimer
        </h1>
        <p className="text-secondary mb-20">
          Last Updated: June 22, 2026
        </p>

        <section className="legal-section">
          <h2 className="text-xl font-semibold legal-section-title">
            1. Product Representation
          </h2>
          <p className="legal-text">
            All product images and colors shown on GVSwift are for illustrative and representative purposes only. We attempt to display colors and textures as accurately as possible. However, the actual visual representation depends on your device&apos;s screen calibration, and we cannot guarantee that your monitor&apos;s display will perfectly match the physical product.
          </p>
        </section>

        <section className="legal-section">
          <h2 className="text-xl font-semibold legal-section-title">
            2. Limitations of Liability
          </h2>
          <p className="legal-text">
            To the maximum extent permitted by applicable Indian consumer protection laws, GVSwift provides its platform, services, and products on an &quot;as-is&quot; basis without warranties of any kind. We are not liable for any indirect, incidental, or consequential damages resulting from platform downtime, delivery delays, or product usage `[TO BE FILLED BY LEGAL]`.
          </p>
        </section>

        <section className="legal-section">
          <h2 className="text-xl font-semibold legal-section-title">
            3. External Links Disclaimer
          </h2>
          <p className="legal-text">
            Our platform may contain links to third-party websites or services (such as delivery tracking portals) that are not owned or controlled by GVSwift. We are not responsible for the content, privacy policies, or practices of any third-party websites.
          </p>
        </section>

        <section className="legal-section">
          <h2 className="text-xl font-semibold legal-section-title">
            4. Legal Counsel Review
          </h2>
          <p className="legal-text">
            The content on this page is a general disclaimer and does not constitute formal legal advice. Legal policies are subject to ongoing review and modification `[TO BE FILLED BY LEGAL]`.
          </p>
        </section>

        <section className="legal-section">
          <h2 className="text-xl font-semibold legal-section-title">
            5. Inquiries
          </h2>
          <p className="legal-text">
            For queries about our legal disclaimers, please contact us:
            <br />
            <strong>Email</strong>: <a href="mailto:support@gvswift.com" className="text-accent">support@gvswift.com</a>
          </p>
        </section>
      </main>
    </div>
  );
}
