import type { Metadata, Viewport } from "next";
import { Inter, EB_Garamond } from "next/font/google";
import "./globals.css";

const SITE_URL = "https://gvswift.vercel.app";
const SITE_TITLE = "GVSwift";
const SITE_DESCRIPTION =
  "Shop GVSwift for fast fashion essentials with Cash on Delivery availability across India.";

/* ── Body font: Inter (replaces Manrope) ── */
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

/* ── Display / Heading font: EB Garamond ── */
const ebGaramond = EB_Garamond({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: "%s | GVSwift",
  },
  description: SITE_DESCRIPTION,
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    type: "website",
    url: SITE_URL,
    siteName: "GVSwift",
  },
};

import { ToastProvider } from "@/components/ui/Toast";
import { CookieConsentBanner } from "@/components/CookieConsentBanner";
import { WishlistProvider } from "@/context/WishlistContext";
import { InitialLoader } from "@/components/ui/InitialLoader";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${ebGaramond.variable}`}
    >
      <body className="antialiased">
        <ToastProvider>
          <InitialLoader />
          <WishlistProvider>
            {children}
            <CookieConsentBanner />
          </WishlistProvider>
        </ToastProvider>
      </body>
    </html>
  );
}