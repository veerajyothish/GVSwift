"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function LoginBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const checkSessionAndShow = async () => {
      const supabase = createSupabaseBrowserClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      // Do not show to anonymous guest visitors
      if (!session) return;

      const dismissed = sessionStorage.getItem("login-banner-dismissed");
      if (!dismissed) {
        setVisible(true);
      }
    };

    checkSessionAndShow();
  }, []);

  const dismiss = () => {
    sessionStorage.setItem("login-banner-dismissed", "1");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm transition-opacity duration-300"
        onClick={dismiss}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Welcome banner"
        className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                   w-[calc(100%-32px)] max-w-md bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl
                   p-8 text-center border border-color-border/10 animate-fade-in"
      >
        <button
          onClick={dismiss}
          aria-label="Dismiss"
          className="absolute top-4 right-4 p-1.5 rounded-full text-gray-400
                     hover:text-gray-700 hover:bg-gray-100 dark:hover:text-gray-200 dark:hover:bg-zinc-800 transition-colors"
          style={{ border: "none", cursor: "pointer", background: "none" }}
        >
          <X size={18} />
        </button>
        <div className="text-4xl mb-3">🎉</div>
        <h2
          className="text-2xl font-semibold mb-2 text-primary"
          style={{ fontFamily: "var(--font-heading)", fontStyle: "italic", fontWeight: 400 }}
        >
          Welcome back!
        </h2>
        <p className="text-secondary text-sm mb-6 leading-relaxed">
          Check out our latest arrivals and exclusive member offers.
        </p>
        <Link
          href="/products"
          onClick={dismiss}
          className="btn btn-primary w-full flex items-center justify-center"
          style={{ minHeight: "44px", borderRadius: "50px", fontWeight: 600 }}
        >
          Shop Now
        </Link>
      </div>
    </>
  );
}
