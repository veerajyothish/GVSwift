import type { Metadata, Viewport } from "next";
import { Inter, EB_Garamond } from "next/font/google";
import "./globals.css";

import { getSiteUrl } from "@/lib/env";

const SITE_URL = getSiteUrl();
const SITE_TITLE = "GVSwift";
const SITE_DESCRIPTION =
  "Shop GVSwift for premium fashion with Cash on Delivery across India.";

/**
 * Inter: display=swap + preload prevents render-blocking.
 * Only load weights actually used — removed 300 (unused).
 */
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
  weight: ["400", "500", "600", "700"],
  preload: true,
});

/**
 * EB Garamond: only normal + italic, only weights used in headings.
 * Subsetting to latin only reduces font download by ~60%.
 */
const ebGaramond = EB_Garamond({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
  weight: ["400", "600"],
  style: ["normal", "italic"],
  preload: true,
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: SITE_TITLE, template: "%s | GVSwift" },
  description: SITE_DESCRIPTION,
  keywords: ["fashion", "online shopping", "cash on delivery", "COD", "India", "GVSwift", "premium clothing"],
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/monogram.png", type: "image/png", sizes: "32x32" },
    ],
    apple: { url: "/monogram.png", sizes: "180x180" },
  },
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    type: "website",
    url: SITE_URL,
    siteName: "GVSwift",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "GVSwift \u2014 Premium Fashion with Cash on Delivery",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: ["/og-image.jpg"],
  },
  alternates: {
    canonical: SITE_URL,
  },
};

import { ToastProvider } from "@/components/ui/Toast";
import { CookieConsentBanner } from "@/components/CookieConsentBanner";
import { WishlistProvider } from "@/context/WishlistContext";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${ebGaramond.variable}`}>
      <head>
        {/* DNS prefetch for external resources */}
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <link rel="dns-prefetch" href="//yrqvqbjtcxycveisyvlg.supabase.co" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap" />
        <link rel="stylesheet" media="print" {...{ onload: "this.media='all'" }} href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap" />
        <noscript><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap" /></noscript>
      </head>
      <body className="antialiased">
        <a
          href="#main-content"
          className="skip-to-content"
        >
          Skip to main content
        </a>
        <ToastProvider>
          <WishlistProvider>
            {children}
            <CookieConsentBanner />
          </WishlistProvider>
        </ToastProvider>
      </body>
    </html>
  );
}