import React from "react";
import { Navbar } from "@/components/ui/Navbar";

export const metadata = {
  title: "Grievance Officer | GVSwift",
  description: "Contact the GVSwift Grievance Officer for grievance redressal and customer complaints.",
};

export default function GrievancePage() {
  return (
    <div style={{ backgroundColor: "var(--color-bg)", minHeight: "100vh" }}>
      <Navbar />
      <main style={{ maxWidth: "800px", margin: "0 auto", padding: "40px 20px", color: "var(--color-text-primary)" }}>
        <h1 className="text-3xl" style={{ color: "var(--color-accent)", marginBottom: "24px" }}>
          Grievance Redressal
        </h1>
        <p style={{ color: "var(--color-text-secondary)", marginBottom: "30px", lineHeight: "1.6" }}>
          In accordance with the Consumer Protection (E-Commerce) Rules, 2020, GVSwift has appointed a Grievance Officer to address customer queries, complaints, and ticket escalations.
        </p>

        <div style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", padding: "24px", marginBottom: "30px" }}>
          <h2 className="text-xl font-semibold" style={{ color: "var(--color-accent)", marginBottom: "16px", borderBottom: "1px solid var(--color-border)", paddingBottom: "8px" }}>
            Officer Contact Details
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "15px" }}>
            <div>
              <strong style={{ color: "var(--color-text-secondary)" }}>Name of the Grievance Officer:</strong>
              <br />
              <span style={{ fontSize: "16px", fontWeight: 500 }}>`[TO BE FILLED]`</span>
            </div>

            <div>
              <strong style={{ color: "var(--color-text-secondary)" }}>Designated Email Address:</strong>
              <br />
              <a href="mailto:gvswift.help@gmail.com" style={{ color: "var(--color-accent)", fontSize: "16px", fontWeight: 500 }}>
                gvswift.help@gmail.com
              </a>
            </div>

            <div>
              <strong style={{ color: "var(--color-text-secondary)" }}>Official Address:</strong>
              <br />
              <span style={{ fontSize: "16px", fontWeight: 500, lineHeight: "1.5" }}>
                `[TO BE FILLED]`
              </span>
            </div>
          </div>
        </div>

        <section style={{ marginBottom: "24px" }}>
          <h2 className="text-xl font-semibold" style={{ marginBottom: "12px", borderBottom: "1px solid var(--color-border)", paddingBottom: "6px" }}>
            Handling Protocol &amp; Timelines
          </h2>
          <p style={{ lineHeight: "1.6", marginBottom: "12px" }}>
            The Grievance Officer is responsible for responding to escalations in a timely and systematic manner:
          </p>
          <ul style={{ paddingLeft: "20px", lineHeight: "1.6" }}>
            <li><strong>Acknowledgement</strong>: We will acknowledge receipt of consumer grievances within <strong>48 hours</strong>.</li>
            <li><strong>Resolution</strong>: We aim to resolve grievances and complaints within **30 days** from the date of receipt.</li>
          </ul>
        </section>

        <section style={{ marginBottom: "24px" }}>
          <h2 className="text-xl font-semibold" style={{ marginBottom: "12px", borderBottom: "1px solid var(--color-border)", paddingBottom: "6px" }}>
            Standard Complaints
          </h2>
          <p style={{ lineHeight: "1.6" }}>
            For standard support queries, order tracking, and general issues, please open a support ticket on our <a href="/support" style={{ color: "var(--color-accent)", fontWeight: 500 }}>Support Portal</a> first. Standard tickets are handled directly by our helpdesk team. You should escalate to the Grievance Officer only if your ticket remains unresolved after 15 days, or you are unsatisfied with the support resolution.
          </p>
        </section>
      </main>
    </div>
  );
}
