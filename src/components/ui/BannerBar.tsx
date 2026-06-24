"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Banner } from "@/app/admin/banners/components/BannersListTable";

export default function BannerBar() {
  const [activeBanner, setActiveBanner] = useState<Banner | null>(null);
  const [isDismissed, setIsDismissed] = useState(true); // Default to true (hidden) until checked
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchActiveBanner() {
      try {
        const res = await fetch("/api/v1/banners/active");
        if (res.ok) {
          const banner = await res.json();
          if (banner) {
            setActiveBanner(banner);
            // Check session storage
            const sessionDismissed = sessionStorage.getItem(`banner_dismissed_${banner.id}`);
            if (!sessionDismissed) {
              setIsDismissed(false);
            }
          }
        }
      } catch (err) {
        console.error("Failed to load active banner", err);
      } finally {
        setLoading(false);
      }
    }

    fetchActiveBanner();
  }, []);

  const handleDismiss = () => {
    if (activeBanner) {
      sessionStorage.setItem(`banner_dismissed_${activeBanner.id}`, "true");
    }
    setIsDismissed(true);
  };

  if (loading || !activeBanner || isDismissed) {
    return null;
  }

  // Get style variables based on type
  let bg = "";
  let text = "";
  let border = "";

  switch (activeBanner.type) {
    case "INFO":
      bg = "color-mix(in oklch, #3b82f6 8%, var(--color-surface, #ffffff))";
      text = "#1d4ed8";
      border = "color-mix(in oklch, #3b82f6 15%, var(--color-surface, #ffffff))";
      break;
    case "SUCCESS":
      bg = "color-mix(in oklch, #10b981 8%, var(--color-surface, #ffffff))";
      text = "#047857";
      border = "color-mix(in oklch, #10b981 15%, var(--color-surface, #ffffff))";
      break;
    case "WARNING":
      bg = "color-mix(in oklch, #f59e0b 8%, var(--color-surface, #ffffff))";
      text = "#b45309";
      border = "color-mix(in oklch, #f59e0b 15%, var(--color-surface, #ffffff))";
      break;
    case "PROMO":
      bg = "color-mix(in oklch, var(--color-primary) 8%, var(--color-surface, #ffffff))";
      text = "var(--color-primary)";
      border = "color-mix(in oklch, var(--color-primary) 15%, var(--color-surface, #ffffff))";
      break;
  }

  return (
    <div
      role="region"
      aria-label="Announcement"
      style={{
        backgroundColor: bg,
        color: text,
        borderBottom: `1px solid ${border}`,
        width: "100%",
        position: "relative",
        zIndex: 50,
        transition: "all 0.3s ease",
      }}
      className="py-2.5 px-4 text-center text-13 font-medium flex items-center justify-between gap-4"
      id={`active-storefront-banner-${activeBanner.id}`}
    >
      {/* Centered Message Area */}
      <div className="flex-1 text-center">
        <span>{activeBanner.message}</span>
        {activeBanner.linkText && activeBanner.linkUrl && (
          <Link
            href={activeBanner.linkUrl}
            className="underline ml-2 hover:opacity-80 transition-opacity"
            style={{ fontWeight: 700 }}
          >
            {activeBanner.linkText} &rarr;
          </Link>
        )}
      </div>

      {/* Dismiss Button */}
      <button
        onClick={handleDismiss}
        className="flex items-center justify-center p-1 rounded-full hover:bg-black/5 active:bg-black/10 transition-colors"
        style={{ color: text }}
        aria-label="Dismiss banner"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2.5}
          stroke="currentColor"
          style={{ width: "16px", height: "16px" }}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
