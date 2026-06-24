"use client";

import React, { useState } from "react";
import Link from "next/link";

interface SectionState {
  shop: boolean;
  support: boolean;
  legal: boolean;
  connect: boolean;
}

export function Footer() {
  const [openSections, setOpenSections] = useState<SectionState>({
    shop: false,
    support: false,
    legal: false,
    connect: false,
  });

  const toggleSection = (section: keyof SectionState) => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        {/* Footer Columns Container */}
        <div className="footer-grid">
          {/* Column 1: Shop */}
          <div className="footer-col">
            <button
              onClick={() => toggleSection("shop")}
              className="footer-header-btn"
            >
              <span>Shop</span>
              <span className="footer-chevron">
                {openSections.shop ? "▲" : "▼"}
              </span>
            </button>
            <div className={`footer-content ${openSections.shop ? "open" : ""}`}>
              <Link href="/products" className="footer-link">
                Shop All Products
              </Link>
            </div>
          </div>

          {/* Column 2: Support */}
          <div className="footer-col">
            <button
              onClick={() => toggleSection("support")}
              className="footer-header-btn"
            >
              <span>Support</span>
              <span className="footer-chevron">
                {openSections.support ? "▲" : "▼"}
              </span>
            </button>
            <div className={`footer-content ${openSections.support ? "open" : ""}`}>
              <Link href="/support" className="footer-link">
                Support Portal
              </Link>
              <Link href="/faq" className="footer-link">
                FAQ
              </Link>
            </div>
          </div>

          {/* Column 3: Legal */}
          <div className="footer-col">
            <button
              onClick={() => toggleSection("legal")}
              className="footer-header-btn"
            >
              <span>Legal</span>
              <span className="footer-chevron">
                {openSections.legal ? "▲" : "▼"}
              </span>
            </button>
            <div className={`footer-content ${openSections.legal ? "open" : ""}`}>
              <Link href="/privacy" className="footer-link">
                Privacy Policy
              </Link>
              <Link href="/terms" className="footer-link">
                Terms of Service
              </Link>
              <Link href="/returns" className="footer-link">
                Returns &amp; Refunds Policy
              </Link>
              <Link href="/shipping" className="footer-link">
                Shipping Policy
              </Link>
              <Link href="/cookies" className="footer-link">
                Cookie Policy
              </Link>
              <Link href="/disclaimer" className="footer-link">
                Disclaimer
              </Link>
              <Link href="/grievance" className="footer-link">
                Grievance Officer
              </Link>
            </div>
          </div>

          {/* Column 4: Connect */}
          <div className="footer-col">
            <button
              onClick={() => toggleSection("connect")}
              className="footer-header-btn"
            >
              <span>Connect</span>
              <span className="footer-chevron">
                {openSections.connect ? "▲" : "▼"}
              </span>
            </button>
            <div className={`footer-content ${openSections.connect ? "open" : ""}`}>
              <span className="footer-text-muted">
                For queries or grievance redressal:
              </span>
              <a href="mailto:gvswift.help@gmail.com" className="footer-link footer-link-highlight">
                gvswift.help@gmail.com
              </a>
              <div className="footer-social-links" style={{ display: "flex", gap: "16px", marginTop: "8px" }}>
                <a
                  href="https://instagram.com/gv_swift"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="footer-link"
                  style={{ color: "var(--color-primary)", display: "inline-flex" }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                  </svg>
                </a>
                <a
                  href="https://www.facebook.com/share/17oYPBS19o/"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook"
                  className="footer-link"
                  style={{ color: "var(--color-primary)", display: "inline-flex" }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                  </svg>
                </a>
                <a
                  href="https://x.com/GVSwift_shop"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="X (Twitter)"
                  className="footer-link"
                  style={{ color: "var(--color-primary)", display: "inline-flex" }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Bottom copyright section */}
        <div className="footer-bottom-bar">
          <span>&copy; {new Date().getFullYear()} GVSwift. All rights reserved.</span>
          <span className="footer-bottom-disclaimer">Shop with Confidence. Fast Delivery &amp; COD assessment active.</span>
        </div>
      </div>
    </footer>
  );
}
