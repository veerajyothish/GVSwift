"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface MobileMenuProps {
  isLoggedIn: boolean;
  isAdmin: boolean;
  cartCount: number;
}

export function MobileMenu({ isLoggedIn, isAdmin, cartCount }: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const drawerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Close drawer on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      // Focus trap
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Focus trap implementation
  useEffect(() => {
    if (!isOpen || !drawerRef.current) return;

    const focusableElements = drawerRef.current.querySelectorAll(
      'a[href], button:not([disabled]), input, textarea, select, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTabTrap = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    };

    window.addEventListener("keydown", handleTabTrap);
    firstElement?.focus();

    return () => {
      window.removeEventListener("keydown", handleTabTrap);
    };
  }, [isOpen]);

  const handleLinkClick = () => {
    setIsOpen(false);
  };

  const handleLogout = async () => {
    setIsOpen(false);
    try {
      await fetch("/api/v1/auth/logout", { method: "POST" });
      router.push("/");
      router.refresh();
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  return (
    <div className="mobile-menu-container">
      {/* Hamburger Trigger Button */}
      <button
        ref={triggerRef}
        onClick={() => setIsOpen(!isOpen)}
        className="mobile-hamburger-btn"
        aria-expanded={isOpen}
        aria-controls="mobile-drawer"
        aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {isOpen ? (
            <>
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </>
          ) : (
            <>
              <line x1="4" y1="12" x2="20" y2="12" />
              <line x1="4" y1="6" x2="20" y2="6" />
              <line x1="4" y1="18" x2="20" y2="18" />
            </>
          )}
        </svg>
      </button>

      {/* Drawer Overlay */}
      {isOpen && (
        <div
          className="mobile-drawer-overlay"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Drawer Panel */}
      <div
        id="mobile-drawer"
        ref={drawerRef}
        className={`mobile-drawer ${isOpen ? "mobile-drawer-open" : ""}`}
        aria-hidden={!isOpen}
      >
        <div className="mobile-drawer-inner">
          <div className="mobile-drawer-header">
            <Link href="/" onClick={handleLinkClick} className="site-navbar-brand">
              <span className="site-navbar-logo" style={{ fontStyle: "italic", fontFamily: "var(--font-heading)" }}>GVSwift</span>
            </Link>
            <button
              onClick={() => setIsOpen(false)}
              className="mobile-drawer-close"
              aria-label="Close menu"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <nav className="mobile-drawer-nav">
            <Link href="/products" onClick={handleLinkClick} className="mobile-drawer-link">
              Shop
            </Link>
            <Link href="/categories" onClick={handleLinkClick} className="mobile-drawer-link">
              Categories
            </Link>
            <Link href="/faq" onClick={handleLinkClick} className="mobile-drawer-link">
              FAQ
            </Link>
            <Link href="/support" onClick={handleLinkClick} className="mobile-drawer-link">
              Support
            </Link>

            <div className="mobile-drawer-divider" />

            {isLoggedIn ? (
              <>
                <Link href="/account" onClick={handleLinkClick} className="mobile-drawer-link">
                  My Account
                </Link>
                <Link href="/cart" onClick={handleLinkClick} className="mobile-drawer-link flex items-center justify-between">
                  <span>Cart</span>
                  {cartCount > 0 && <span className="mobile-drawer-badge">{cartCount}</span>}
                </Link>
                <Link href="/orders" onClick={handleLinkClick} className="mobile-drawer-link">
                  My Orders
                </Link>
                {isAdmin && (
                  <Link href="/admin" onClick={handleLinkClick} className="mobile-drawer-link" style={{ color: "var(--color-primary)", fontWeight: 600 }}>
                    Admin Dashboard
                  </Link>
                )}
                <button onClick={handleLogout} className="mobile-drawer-logout-btn">
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/login" onClick={handleLinkClick} className="mobile-drawer-link">
                  Sign In
                </Link>
                <Link href="/signup" onClick={handleLinkClick} className="mobile-drawer-signup-btn">
                  Create Account
                </Link>
              </>
            )}
          </nav>
        </div>
      </div>
    </div>
  );
}
