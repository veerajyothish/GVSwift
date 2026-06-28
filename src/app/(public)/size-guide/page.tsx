import React from "react";
import { Navbar } from "@/components/ui/Navbar";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Size Guide & Fit Guide",
  description:
    "Find your perfect fit with GVSwift's comprehensive size guide for footwear and apparel.",
};

export const revalidate = 86400; // 24h — size charts rarely change

const FOOTWEAR_SIZES = [
  { uk: "6", eu: "39", us: "7", cm: "24.5" },
  { uk: "7", eu: "40", us: "8", cm: "25.4" },
  { uk: "8", eu: "41", us: "9", cm: "26.2" },
  { uk: "9", eu: "42", us: "10", cm: "27.0" },
  { uk: "10", eu: "43", us: "11", cm: "27.9" },
  { uk: "11", eu: "44", us: "12", cm: "28.8" },
  { uk: "12", eu: "45", us: "13", cm: "29.6" },
];

const APPAREL_SIZES = [
  { size: "XS", chest: "32–34\"", waist: "26–28\"", hip: "34–36\"" },
  { size: "S",  chest: "34–36\"", waist: "28–30\"", hip: "36–38\"" },
  { size: "M",  chest: "36–38\"", waist: "30–32\"", hip: "38–40\"" },
  { size: "L",  chest: "38–40\"", waist: "32–34\"", hip: "40–42\"" },
  { size: "XL", chest: "40–42\"", waist: "34–36\"", hip: "42–44\"" },
  { size: "XXL",chest: "42–44\"", waist: "36–38\"", hip: "44–46\"" },
];

export default function SizeGuidePage() {
  return (
    <div style={{ background: "var(--color-bg)", minHeight: "100vh" }}>
      <Navbar />

      {/* Header */}
      <div
        style={{
          borderBottom: "1px solid var(--color-border)",
          padding: "48px 24px 40px",
          textAlign: "center",
          background: "var(--color-surface)",
        }}
      >
        <p
          style={{
            fontSize: "11px",
            fontWeight: 600,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            color: "var(--color-accent)",
            marginBottom: "12px",
          }}
        >
          Fit &amp; Sizing
        </p>
        <h1
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: "clamp(28px, 4vw, 42px)",
            fontWeight: 400,
            fontStyle: "italic",
            color: "var(--color-text-primary)",
            marginBottom: "12px",
          }}
        >
          Size Guide
        </h1>
        <p
          style={{
            fontSize: "15px",
            color: "var(--color-text-secondary)",
            maxWidth: "480px",
            margin: "0 auto",
            lineHeight: 1.6,
          }}
        >
          All GVSwift products are true to size. If you&apos;re between sizes,
          we recommend sizing up for a relaxed fit.
        </p>
      </div>

      <div
        style={{
          maxWidth: "900px",
          margin: "0 auto",
          padding: "56px 24px 80px",
          display: "flex",
          flexDirection: "column",
          gap: "56px",
        }}
      >
        {/* How to Measure */}
        <section>
          <h2
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "22px",
              fontWeight: 600,
              color: "var(--color-text-primary)",
              marginBottom: "20px",
              paddingBottom: "12px",
              borderBottom: "1px solid var(--color-border)",
            }}
          >
            How to Measure
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "24px",
            }}
          >
            {[
              {
                emoji: "📏",
                title: "Foot Length",
                desc: "Stand on a piece of paper. Mark the longest toe and the heel. Measure the distance in cm.",
              },
              {
                emoji: "👔",
                title: "Chest",
                desc: "Measure around the fullest part of your chest, keeping the tape horizontal.",
              },
              {
                emoji: "⚖️",
                title: "Waist",
                desc: "Measure around your natural waistline — the narrowest part of your torso.",
              },
              {
                emoji: "📐",
                title: "Hip",
                desc: "Measure around the fullest part of your hips, about 8 inches below your waist.",
              },
            ].map((tip) => (
              <div
                key={tip.title}
                style={{
                  background: "var(--color-surface)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-lg)",
                  padding: "24px 20px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                }}
              >
                <span style={{ fontSize: "28px" }}>{tip.emoji}</span>
                <strong
                  style={{
                    fontSize: "14px",
                    fontWeight: 600,
                    color: "var(--color-text-primary)",
                  }}
                >
                  {tip.title}
                </strong>
                <p
                  style={{
                    fontSize: "13px",
                    color: "var(--color-text-secondary)",
                    lineHeight: 1.55,
                    margin: 0,
                  }}
                >
                  {tip.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Footwear Size Chart */}
        <section>
          <h2
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "22px",
              fontWeight: 600,
              color: "var(--color-text-primary)",
              marginBottom: "20px",
              paddingBottom: "12px",
              borderBottom: "1px solid var(--color-border)",
            }}
          >
            Footwear Sizes
          </h2>
          <div style={{ overflowX: "auto", borderRadius: "var(--radius-lg)", border: "1px solid var(--color-border)" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "14px",
                background: "var(--color-bg)",
              }}
            >
              <thead>
                <tr style={{ background: "var(--color-surface)" }}>
                  {["UK", "EU", "US", "Foot Length (cm)"].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: "14px 20px",
                        fontWeight: 600,
                        fontSize: "11px",
                        letterSpacing: "0.07em",
                        textTransform: "uppercase",
                        color: "var(--color-text-secondary)",
                        textAlign: "center",
                        borderBottom: "1px solid var(--color-border)",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {FOOTWEAR_SIZES.map((row, i) => (
                  <tr
                    key={row.uk}
                    style={{
                      borderBottom:
                        i < FOOTWEAR_SIZES.length - 1
                          ? "1px solid var(--color-border)"
                          : "none",
                    }}
                  >
                    {[row.uk, row.eu, row.us, row.cm].map((val, j) => (
                      <td
                        key={j}
                        style={{
                          padding: "14px 20px",
                          textAlign: "center",
                          color:
                            j === 0
                              ? "var(--color-accent)"
                              : "var(--color-text-primary)",
                          fontWeight: j === 0 ? 600 : 400,
                        }}
                      >
                        {val}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Apparel Size Chart */}
        <section>
          <h2
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "22px",
              fontWeight: 600,
              color: "var(--color-text-primary)",
              marginBottom: "20px",
              paddingBottom: "12px",
              borderBottom: "1px solid var(--color-border)",
            }}
          >
            Apparel Sizes
          </h2>
          <div style={{ overflowX: "auto", borderRadius: "var(--radius-lg)", border: "1px solid var(--color-border)" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "14px",
                background: "var(--color-bg)",
              }}
            >
              <thead>
                <tr style={{ background: "var(--color-surface)" }}>
                  {["Size", "Chest", "Waist", "Hip"].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: "14px 20px",
                        fontWeight: 600,
                        fontSize: "11px",
                        letterSpacing: "0.07em",
                        textTransform: "uppercase",
                        color: "var(--color-text-secondary)",
                        textAlign: "center",
                        borderBottom: "1px solid var(--color-border)",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {APPAREL_SIZES.map((row, i) => (
                  <tr
                    key={row.size}
                    style={{
                      borderBottom:
                        i < APPAREL_SIZES.length - 1
                          ? "1px solid var(--color-border)"
                          : "none",
                    }}
                  >
                    {[row.size, row.chest, row.waist, row.hip].map((val, j) => (
                      <td
                        key={j}
                        style={{
                          padding: "14px 20px",
                          textAlign: "center",
                          color:
                            j === 0
                              ? "var(--color-accent)"
                              : "var(--color-text-primary)",
                          fontWeight: j === 0 ? 600 : 400,
                        }}
                      >
                        {val}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Fit Tips */}
        <section
          style={{
            background: "rgba(107, 30, 46, 0.04)",
            border: "1px solid rgba(107, 30, 46, 0.15)",
            borderRadius: "var(--radius-lg)",
            padding: "28px 32px",
          }}
        >
          <h3
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "18px",
              fontWeight: 600,
              color: "var(--color-accent)",
              marginBottom: "16px",
            }}
          >
            Fit Tips
          </h3>
          <ul
            style={{
              listStyle: "none",
              padding: 0,
              margin: 0,
              display: "flex",
              flexDirection: "column",
              gap: "10px",
            }}
          >
            {[
              "All GVSwift footwear runs true to UK sizing.",
              "For wide feet, we recommend going half a size up.",
              "Our leather products have a slight break-in period of 3–5 wears for optimal comfort.",
              "Apparel measurements are in inches. For a relaxed fit, size up.",
              "Still unsure? Contact us — we're happy to help you find the perfect fit.",
            ].map((tip) => (
              <li
                key={tip}
                style={{
                  display: "flex",
                  gap: "10px",
                  fontSize: "14px",
                  color: "var(--color-text-secondary)",
                  lineHeight: 1.5,
                }}
              >
                <span style={{ color: "var(--color-accent)", fontWeight: 700, flexShrink: 0 }}>
                  →
                </span>
                {tip}
              </li>
            ))}
          </ul>
        </section>

        {/* Back CTA */}
        <div style={{ textAlign: "center" }}>
          <Link
            href="/products"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "13px",
              fontWeight: 600,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: "var(--color-accent)",
              textDecoration: "none",
              padding: "12px 28px",
              border: "1px solid var(--color-accent)",
              borderRadius: "var(--radius-pill)",
              transition: "background 0.2s, color 0.2s",
            }}
          >
            ← Back to Collection
          </Link>
        </div>
      </div>
    </div>
  );
}
