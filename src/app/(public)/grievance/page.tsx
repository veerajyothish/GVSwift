import React from "react";
import { Navbar } from "@/components/ui/Navbar";

import Link from "next/link";

export const metadata = {
  title: "Grievance Officer | GVSwift",
  description: "Contact the GVSwift Grievance Officer for grievance redressal and customer complaints.",
};

export default function GrievancePage() {
  return (
    <div className="min-h-screen bg-default">
      <Navbar />
      <main className="container-sm text-primary">
        <h1 className="text-3xl legal-title">
          Grievance Redressal
        </h1>
        <p className="text-secondary mb-32 lh-1-6">
          In accordance with the Consumer Protection (E-Commerce) Rules, 2020, GVSwift has appointed a Grievance Officer to address customer queries, complaints, and ticket escalations.
        </p>

        <div className="card p-5 mb-32">
          <h2 className="text-xl font-semibold text-accent legal-section-title">
            Officer Contact Details
          </h2>

          <div className="flex flex-col gap-3 text-15">
            <div>
              <strong className="text-secondary">Name of the Grievance Officer:</strong>
              <br />
              <span className="text-base font-medium">`[TO BE FILLED]`</span>
            </div>

            <div>
              <strong className="text-secondary">Designated Email Address:</strong>
              <br />
              <a href="mailto:support@gvswift.com" className="text-accent text-base font-medium">
                support@gvswift.com
              </a>
            </div>

            <div>
              <strong className="text-secondary">Official Address:</strong>
              <br />
              <span className="text-base font-medium lh-1-5">
                `[TO BE FILLED]`
              </span>
            </div>
          </div>
        </div>

        <section className="legal-section">
          <h2 className="text-xl font-semibold legal-section-title">
            Handling Protocol &amp; Timelines
          </h2>
          <p className="legal-text mb-12">
            The Grievance Officer is responsible for responding to escalations in a timely and systematic manner:
          </p>
          <ul className="legal-list">
            <li><strong>Acknowledgement</strong>: We will acknowledge receipt of consumer grievances within <strong>48 hours</strong>.</li>
            <li><strong>Resolution</strong>: We aim to resolve grievances and complaints within **30 days** from the date of receipt.</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2 className="text-xl font-semibold legal-section-title">
            Standard Complaints
          </h2>
          <p className="legal-text">
            For standard support queries, order tracking, and general issues, please open a support ticket on our <Link href="/support" className="text-accent font-medium">Support Portal</Link> first. Standard tickets are handled directly by our helpdesk team. You should escalate to the Grievance Officer only if your ticket remains unresolved after 15 days, or you are unsatisfied with the support resolution.
          </p>
        </section>
      </main>
    </div>
  );
}
