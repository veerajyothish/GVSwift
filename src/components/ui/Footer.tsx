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
              <div className="footer-social-links">
                <span className="footer-social-placeholder">[Instagram Link Placeholder]</span>
                <span className="footer-social-placeholder">[Twitter Link Placeholder]</span>
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
