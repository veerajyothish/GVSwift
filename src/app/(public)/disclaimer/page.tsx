import React from "react";
import { Navbar } from "@/components/ui/Navbar";

export const metadata = {
  title: "Disclaimer | GVSwift",
  description: "Read GVSwift's legal disclaimer regarding product representations and liability limits.",
};

export default function DisclaimerPage() {
  return (
    <div style={{ backgroundColor: "var(--color-bg)", minHeight: "100vh" }}>
      <Navbar />
      <main style={{ maxWidth: "800px", margin: "0 auto", padding: "40px 20px", color: "var(--color-text-primary)" }}>
        <h1 className="text-3xl" style={{ color: "var(--color-accent)", marginBottom: "24px" }}>
          Disclaimer
        </h1>
        <p style={{ color: "var(--color-text-secondary)", marginBottom: "20px" }}>
          Last Updated: June 22, 2026
        </p>

        <section style={{ marginBottom: "24px" }}>
          <h2 className="text-xl font-semibold" style={{ marginBottom: "12px", borderBottom: "1px solid var(--color-border)", paddingBottom: "6px" }}>
            1. Product Representation
          </h2>
          <p style={{ lineHeight: "1.6" }}>
            All product images and colors shown on GVSwift are for illustrative and representative purposes only. We attempt to display colors and textures as accurately as possible. However, the actual visual representation depends on your device&apos;s screen calibration, and we cannot guarantee that your monitor&apos;s display will perfectly match the physical product.
          </p>
        </section>

        <section style={{ marginBottom: "24px" }}>
          <h2 className="text-xl font-semibold" style={{ marginBottom: "12px", borderBottom: "1px solid var(--color-border)", paddingBottom: "6px" }}>
            2. Limitations of Liability
          </h2>
          <p style={{ lineHeight: "1.6" }}>
            To the maximum extent permitted by applicable Indian consumer protection laws, GVSwift provides its platform, services, and products on an &quot;as-is&quot; basis without warranties of any kind. We are not liable for any indirect, incidental, or consequential damages resulting from platform downtime, delivery delays, or product usage `[TO BE FILLED BY LEGAL]`.
          </p>
        </section>

        <section style={{ marginBottom: "24px" }}>
          <h2 className="text-xl font-semibold" style={{ marginBottom: "12px", borderBottom: "1px solid var(--color-border)", paddingBottom: "6px" }}>
            3. External Links Disclaimer
          </h2>
          <p style={{ lineHeight: "1.6" }}>
            Our platform may contain links to third-party websites or services (such as delivery tracking portals) that are not owned or controlled by GVSwift. We are not responsible for the content, privacy policies, or practices of any third-party websites.
          </p>
        </section>

        <section style={{ marginBottom: "24px" }}>
          <h2 className="text-xl font-semibold" style={{ marginBottom: "12px", borderBottom: "1px solid var(--color-border)", paddingBottom: "6px" }}>
            4. Legal Counsel Review
          </h2>
          <p style={{ lineHeight: "1.6" }}>
            The content on this page is a general disclaimer and does not constitute formal legal advice. Legal policies are subject to ongoing review and modification `[TO BE FILLED BY LEGAL]`.
          </p>
        </section>

        <section style={{ marginBottom: "24px" }}>
          <h2 className="text-xl font-semibold" style={{ marginBottom: "12px", borderBottom: "1px solid var(--color-border)", paddingBottom: "6px" }}>
            5. Inquiries
          </h2>
          <p style={{ lineHeight: "1.6" }}>
            For queries about our legal disclaimers, please contact us:
            <br />
            <strong>Email</strong>: <a href="mailto:gvswift.help@gmail.com" style={{ color: "var(--color-accent)" }}>gvswift.help@gmail.com</a>
          </p>
        </section>
      </main>
    </div>
  );
}
