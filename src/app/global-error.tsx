"use client";

// global-error.tsx — catches React rendering errors at the root layout level.
// Required by @sentry/nextjs for RSC error reporting.
import * as Sentry from "@sentry/nextjs";
import NextError from "next/error";
import { useEffect } from "react";

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ backgroundColor: "var(--color-bg, #FDFAF5)", color: "var(--color-text-primary, #1A1A1A)", fontFamily: "system-ui, sans-serif", margin: 0 }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: "40px", textAlign: "center" }}>
          <h1 style={{ fontFamily: "var(--font-heading, serif)", fontSize: "48px", fontWeight: 600, fontStyle: "italic", color: "var(--color-accent, #6B1E2E)", margin: "0 0 16px 0" }}>
            Critical Error
          </h1>
          <p style={{ margin: "0 0 24px 0", color: "var(--color-text-secondary, #6B5B55)" }}>
            Something went wrong while rendering the application.
          </p>
          <button 
            onClick={() => window.location.reload()}
            style={{ 
              padding: "12px 32px", 
              backgroundColor: "var(--color-accent, #6B1E2E)", 
              color: "#FDFAF5", 
              border: "none", 
              borderRadius: "9999px", 
              cursor: "pointer", 
              fontWeight: 600 
            }}
          >
            Try Again
          </button>
        </div>
      </body>
    </html>
  );
}
