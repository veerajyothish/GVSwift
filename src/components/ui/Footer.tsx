"use client";

/**
 * Footer — PDF p.3/7/9/11:
 * p.3: centered GVSWIFT wordmark, 4 inline links (Privacy Policy · Terms · Shipping · Sustainability),
 *      copyright "© 2024 GVSWIFT PREMIUM. CRAFTED IN INDIA." on surface bg.
 * p.7/9/11: GVSwift logo left + tagline, 3 link columns (Shop/Company/Customer Care, Collections/Our Story/Contact Us, Couture/Sustainability/Shipping & Returns),
 *      right: copyright. Surface bg, 4-col desktop, accordion mobile.
 */

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";

interface SectionState {
  shop: boolean;
  company: boolean;
  legal: boolean;
  connect: boolean;
}

export function Footer() {
  const [openSections, setOpenSections] = useState<SectionState>({
    shop: false,
    company: false,
    legal: false,
    connect: false,
  });

  const toggle = (section: keyof SectionState) =>
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));

  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        {/* ── Main grid: brand + 3 link cols + social ── */}
        <div className="footer-grid">

          {/* Col 1: Brand */}
          <div className="footer-col" style={{ gap: "12px" }}>
            <Link
              href="/"
              style={{
                display: "inline-flex",
                alignItems: "center",
                marginBottom: "8px",
              }}
            >
              <Image
                src="/logo.png"
                alt="GVSwift Logo"
                width={180}
                height={42}
                style={{
                  height: "42px",
                  width: "auto",
                  objectFit: "contain",
                }}
              />
            </Link>
            <p
              style={{
                fontSize: "13px",
                color: "var(--color-text-secondary)",
                lineHeight: 1.6,
                maxWidth: "200px",
              }}
            >
              Exquisite Indian Craftsmanship. Shop with Confidence.
            </p>
          </div>

          {/* Col 2: Shop */}
          <div className="footer-col">
            <button onClick={() => toggle("shop")} className="footer-header-btn" aria-expanded={openSections.shop} aria-controls="footer-shop">
              <span>Shop</span>
              <span className="footer-chevron" aria-hidden="true">{openSections.shop ? "▲" : "▼"}</span>
            </button>
            <div id="footer-shop" className={`footer-content ${openSections.shop ? "open" : ""}`}>
              <Link href="/products" className="footer-link">All Products</Link>
              <Link href="/products?sort=newest" className="footer-link">New Arrivals</Link>
              <Link href="/shops" className="footer-link">Shops</Link>
              <Link href="/faq" className="footer-link">FAQ</Link>
            </div>
          </div>

          {/* Col 3: Company / Support */}
          <div className="footer-col">
            <button onClick={() => toggle("company")} className="footer-header-btn" aria-expanded={openSections.company} aria-controls="footer-company">
              <span>Company</span>
              <span className="footer-chevron" aria-hidden="true">{openSections.company ? "▲" : "▼"}</span>
            </button>
            <div id="footer-company" className={`footer-content ${openSections.company ? "open" : ""}`}>
              <Link href="/support" className="footer-link">Customer Care</Link>
              <Link href="/returns" className="footer-link">Shipping & Returns</Link>
              <Link href="/privacy" className="footer-link">Privacy Policy</Link>
              <Link href="/terms" className="footer-link">Terms of Service</Link>
              <Link href="/grievance" className="footer-link">Grievance Officer</Link>
            </div>
          </div>

          {/* Col 4: Connect */}
          <div className="footer-col">
            <button onClick={() => toggle("connect")} className="footer-header-btn" aria-expanded={openSections.connect} aria-controls="footer-connect">
              <span>Connect</span>
              <span className="footer-chevron" aria-hidden="true">{openSections.connect ? "▲" : "▼"}</span>
            </button>
            <div id="footer-connect" className={`footer-content ${openSections.connect ? "open" : ""}`}>
              {/* Social links — PDF p.9: INSTAGRAM · PINTEREST · FACEBOOK */}
              {[
                { label: "Instagram", href: "https://instagram.com/gv_swift" },
                { label: "Facebook", href: "https://www.facebook.com/share/17oYPBS19o/" },
                { label: "X / Twitter", href: "https://x.com/GVSwift_shop" },
              ].map(({ label, href }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="footer-link"
                >
                  {label}
                </a>
              ))}
              <a href="mailto:gvswift.help@gmail.com" className="footer-link footer-link-highlight">
                gvswift.help@gmail.com
              </a>
            </div>
          </div>
        </div>

        {/* ── Bottom bar ── */}
        <div className="footer-bottom-bar">
          <span style={{ fontSize: "13px", color: "var(--color-text-secondary)" }}>
            © {new Date().getFullYear()} GVSwift. Crafted with Integrity.
          </span>
          <span
            style={{
              fontSize: "12px",
              color: "var(--color-text-secondary)",
              opacity: 0.7,
            }}
          >
            Shop with Confidence · Fast Delivery · COD Available
          </span>
        </div>
      </div>
    </footer>
  );
}