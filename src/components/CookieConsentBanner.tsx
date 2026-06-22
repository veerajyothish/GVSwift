"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

const CONSENT_COOKIE = "gvswift_cookie_consent";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

function hasConsentCookie() {
  return document.cookie
    .split(";")
    .some((cookie) => cookie.trim().startsWith(`${CONSENT_COOKIE}=`));
}

function persistConsent(choice: "accepted" | "declined") {
  document.cookie = [
    `${CONSENT_COOKIE}=${choice}`,
    `Max-Age=${MAX_AGE_SECONDS}`,
    "Path=/",
    "SameSite=Lax",
    window.location.protocol === "https:" ? "Secure" : "",
  ]
    .filter(Boolean)
    .join("; ");
}

export function CookieConsentBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(!hasConsentCookie());
  }, []);

  const handleChoice = (choice: "accepted" | "declined") => {
    persistConsent(choice);
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <section
      className="cookie-consent"
      role="region"
      aria-labelledby="cookie-consent-title"
      aria-describedby="cookie-consent-description"
    >
      <div className="cookie-consent-inner">
        <div className="cookie-consent-copy">
          <h2 id="cookie-consent-title" className="cookie-consent-title">
            Cookie Preferences
          </h2>
          <p id="cookie-consent-description" className="cookie-consent-text">
            GVSwift uses essential cookies to keep the storefront working and optional analytics cookies to improve the shopping experience. You can accept or decline optional cookies.
          </p>
          <Link href="/cookies" className="cookie-consent-link">
            Cookie Policy
          </Link>
        </div>
        <div className="cookie-consent-actions" aria-label="Cookie consent actions">
          <Button type="button" variant="secondary" onClick={() => handleChoice("declined")}>
            Decline
          </Button>
          <Button type="button" variant="primary" onClick={() => handleChoice("accepted")}>
            Accept
          </Button>
        </div>
      </div>
    </section>
  );
}
