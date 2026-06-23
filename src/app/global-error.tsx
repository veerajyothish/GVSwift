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
    <html>
      <body>
        {/* Render the default Next.js error page */}
        <NextError statusCode={0} />
      </body>
    </html>
  );
}
