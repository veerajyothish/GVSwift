import React from "react";
import Link from "next/link";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav
      aria-label="Breadcrumb"
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        fontSize: "13px",
        color: "var(--color-text-secondary)",
        flexWrap: "wrap",
      }}
    >
      <Link
        href="/"
        style={{
          color: "var(--color-text-secondary)",
          transition: "color 0.2s ease",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-accent)")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-text-secondary)")}
      >
        Home
      </Link>
      {items.map((item, idx) => (
        <React.Fragment key={idx}>
          <span style={{ color: "var(--color-text-secondary)", opacity: 0.5, userSelect: "none" }}>/</span>
          {item.href ? (
            <Link
              href={item.href}
              style={{
                color: "var(--color-text-secondary)",
                transition: "color 0.2s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-accent)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-text-secondary)")}
            >
              {item.label}
            </Link>
          ) : (
            <span style={{ color: "var(--color-text-primary)", fontWeight: "500" }}>
              {item.label}
            </span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}
