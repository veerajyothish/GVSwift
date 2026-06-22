import type { Metadata } from "next";
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
  title: {
    default: "GVSwift — Fast Fashion, COD Available",
    template: "%s | GVSwift",
  },
  description:
    "Shop the latest fashion at GVSwift. Cash on delivery available across India.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://gvswift.vercel.app"
  ),
};

import { ToastProvider } from "@/components/ui/Toast";
import { CookieConsentBanner } from "@/components/CookieConsentBanner";

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
