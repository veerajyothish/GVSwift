"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export default function BackButton() {
  const router = useRouter();

  return (
    <button
      onClick={() => router.back()}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        background: "transparent",
        border: "none",
        color: "var(--color-accent)",
        fontSize: "13px",
        fontWeight: 600,
        cursor: "pointer",
        padding: "8px 0",
        transition: "opacity 0.2s, transform 0.2s",
        outline: "none",
        fontFamily: "var(--font-body)",
        letterSpacing: "0.02em",
        textTransform: "uppercase",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.opacity = "0.75";
        e.currentTarget.style.transform = "translateX(-2px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.opacity = "1";
        e.currentTarget.style.transform = "translateX(0)";
      }}
    >
      <ArrowLeft size={14} strokeWidth={2.5} />
      Back
    </button>
  );
}
