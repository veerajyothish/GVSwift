import type { Metadata, Viewport } from "next";
import { Inter, Fraunces } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://gvswift.vercel.app"
  ),
  title: {
    default: "GVSwift — Fast Fashion, COD Available",
    template: "%s | GVSwift",
  },
  description:
    "Shop GVSwift for fast fashion essentials with Cash on Delivery availability across India.",
  openGraph: {
    type: "website",
    siteName: "GVSwift",
    title: "GVSwift — Fast Fashion, COD Available",
    description:
      "Shop GVSwift for fast fashion essentials with Cash on Delivery availability across India.",
    url: "/",
  },
};

import { ToastProvider } from "@/components/ui/Toast";
import { CookieConsentBanner } from "@/components/CookieConsentBanner";

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
      className={`${inter.variable} ${fraunces.variable}`}
    >
      <body className="antialiased">
        <ToastProvider>
          {children}
          <CookieConsentBanner />
        </ToastProvider>
      </body>
    </html>
  );
}
