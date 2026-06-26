import type { Metadata, Viewport } from "next";
import { Manrope, EB_Garamond } from "next/font/google";
import "./globals.css";

const SITE_URL = "https://gvswift.vercel.app";
const SITE_TITLE = "GVSwift";
const SITE_DESCRIPTION =
  "Shop GVSwift for fast fashion essentials with Cash on Delivery availability across India.";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const ebGaramond = EB_Garamond({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
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
import LoginBanner from "@/components/ui/LoginBanner";

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
      className={`${manrope.variable} ${ebGaramond.variable}`}
    >
      <body className="antialiased">
        <ToastProvider>
          <WishlistProvider>
            {/* Login welcome popup — shows once per session after login, dismissed with X */}
            <LoginBanner />
            {children}
            <CookieConsentBanner />
          </WishlistProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
