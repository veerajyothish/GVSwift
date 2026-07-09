"use client";

/**
 * NavbarIconsAndSearch — PDF p.1/4/6:
 * Right-side icons: account (circle dashed outline on PDF p.1), shopping bag.
 * Both wine-red, clean SVG, badge dot on cart.
 */
import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useWishlist } from "@/context/WishlistContext";

interface NavbarIconsAndSearchProps {
  isLoggedIn: boolean;
  cartCount: number;
  wishlistIcon: React.ReactNode;
}

export function NavbarIconsAndSearch({
  isLoggedIn,
  cartCount,
}: NavbarIconsAndSearchProps) {
  const [clientCartCount, setClientCartCount] = useState(cartCount);
  const [cartBounce, setCartBounce] = useState(false);
  const cartRef = useRef<HTMLAnchorElement>(null);
  const { wishlistedIds } = useWishlist();
  const wishlistCount = wishlistedIds.length;

  useEffect(() => {
    // Keep local state in sync when page props change
    setClientCartCount(cartCount);
  }, [cartCount]);

  useEffect(() => {
    const handleAddOne = () => setClientCartCount((c) => c + 1);
    const handleRemoveOne = () => setClientCartCount((c) => Math.max(0, c - 1));
    const handleUpdate = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (typeof detail === "number") {
        setClientCartCount(detail);
      }
    };

    window.addEventListener("gvswift-cart-add-one", handleAddOne);
    window.addEventListener("gvswift-cart-remove-one", handleRemoveOne);
    window.addEventListener("gvswift-cart-updated", handleUpdate);

    return () => {
      window.removeEventListener("gvswift-cart-add-one", handleAddOne);
      window.removeEventListener("gvswift-cart-remove-one", handleRemoveOne);
      window.removeEventListener("gvswift-cart-updated", handleUpdate);
    };
  }, []);

  // ponytail: fly-to-cart animation
  const handleCartFly = useCallback((e: Event) => {
    const imgUrl = (e as CustomEvent).detail;
    if (!imgUrl || !cartRef.current) return;
    const cartRect = cartRef.current.getBoundingClientRect();
    const el = document.createElement("img");
    el.src = imgUrl;
    el.style.cssText = `
      position:fixed; z-index:99999; width:56px; height:56px; border-radius:8px;
      object-fit:cover; pointer-events:none;
      top:50%; left:50%; transform:translate(-50%,-50%);
      transition: all 0.6s cubic-bezier(0.16,1,0.3,1);
    `;
    document.body.appendChild(el);
    requestAnimationFrame(() => {
      el.style.top = `${cartRect.top + cartRect.height / 2}px`;
      el.style.left = `${cartRect.left + cartRect.width / 2}px`;
      el.style.width = "16px";
      el.style.height = "16px";
      el.style.opacity = "0.3";
      el.style.borderRadius = "50%";
    });
    setTimeout(() => {
      el.remove();
      setCartBounce(true);
      setTimeout(() => setCartBounce(false), 400);
    }, 650);
  }, []);

  useEffect(() => {
    window.addEventListener("gvswift-cart-fly", handleCartFly);
    return () => window.removeEventListener("gvswift-cart-fly", handleCartFly);
  }, [handleCartFly]);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "4px",
        flexShrink: 0,
      }}
    >
      {/* Wishlist heart icon (desktop only) — Moved inside Client Component for instant count updates */}
      {isLoggedIn && (
        <Link
          href="/account/wishlist"
          prefetch={true}
          aria-label="Wishlist"
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: "40px",
            height: "40px",
            color: "var(--color-accent)",
            position: "relative",
            textDecoration: "none",
            flexShrink: 0,
          }}
          className="navbar-desktop-links"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
          {wishlistCount > 0 && (
            <span
              style={{
                position: "absolute",
                top: "4px",
                right: "4px",
                width: "15px",
                height: "15px",
                borderRadius: "50%",
                background: "var(--color-accent)",
                color: "#fff",
                fontSize: "9px",
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {wishlistCount}
            </span>
          )}
        </Link>
      )}

      {/* Account icon — PDF p.1: dashed circle on desktop when logged in */}
      <Link
        href={isLoggedIn ? "/account" : "/login"}
        prefetch={true}
        aria-label={isLoggedIn ? "My account" : "Sign in"}
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: "38px",
          height: "38px",
          borderRadius: "50%",
          border: isLoggedIn
            ? "1.5px dashed var(--color-accent)"
            : "1px solid transparent",
          color: "var(--color-accent)",
          textDecoration: "none",
          transition: "background 0.15s",
        }}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      </Link>

      {/* Cart / shopping bag icon — PDF p.1/4 */}
      <Link
        ref={cartRef}
        href="/cart"
        prefetch={true}
        aria-label={`Shopping cart${clientCartCount > 0 ? `, ${clientCartCount} items` : ""}`}
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: "38px",
          height: "38px",
          borderRadius: "50%",
          color: "var(--color-accent)",
          textDecoration: "none",
          position: "relative",
          transition: "background 0.15s, transform 0.3s cubic-bezier(0.16,1,0.3,1)",
          transform: cartBounce ? "scale(1.25)" : "scale(1)",
        }}
      >
        <svg
          width="19"
          height="19"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
          <line x1="3" y1="6" x2="21" y2="6" />
          <path d="M16 10a4 4 0 0 1-8 0" />
        </svg>

        {clientCartCount > 0 && (
          <span
            aria-hidden
            style={{
              position: "absolute",
              top: "4px",
              right: "4px",
              width: "16px",
              height: "16px",
              borderRadius: "50%",
              background: "var(--color-accent)",
              color: "#fff",
              fontSize: "9px",
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              lineHeight: 1,
            }}
          >
            {clientCartCount > 9 ? "9+" : clientCartCount}
          </span>
        )}
      </Link>
    </div>
  );
}