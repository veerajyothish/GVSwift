"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

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

const PANTS_SIZES = [
  { size: "28", waist: "29\"", hip: "37\"", inseam: "30\"" },
  { size: "30", waist: "31\"", hip: "39\"", inseam: "30\"" },
  { size: "32", waist: "33\"", hip: "41\"", inseam: "32\"" },
  { size: "34", waist: "35\"", hip: "43\"", inseam: "32\"" },
  { size: "36", waist: "37\"", hip: "45\"", inseam: "34\"" },
  { size: "38", waist: "39\"", hip: "47\"", inseam: "34\"" },
];

export function SizeGuideOverlay() {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<"apparel" | "pants" | "footwear" | "advisor">("apparel");
  
  // Advisor state
  const [userHeight, setUserHeight] = useState(175);
  const [userWeight, setUserWeight] = useState(70);

  useEffect(() => {
    setMounted(true);
    const handleOpen = () => {
      setIsOpen(true);
    };
    window.addEventListener("gvswift-open-size-guide", handleOpen);
    return () => window.removeEventListener("gvswift-open-size-guide", handleOpen);
  }, []);

  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  const closeOverlay = () => setIsOpen(false);

  // Simple advisor logic (from ProductDetailClient)
  let recommended = "M";
  let prob = "85%";
  if (userWeight < 55) { recommended = "XS"; prob = "90%"; }
  else if (userWeight < 65) { recommended = "S"; prob = "88%"; }
  else if (userWeight < 75) { recommended = "M"; prob = "85%"; }
  else if (userWeight < 85) { recommended = "L"; prob = "82%"; }
  else if (userWeight < 95) { recommended = "XL"; prob = "80%"; }
  else { recommended = "XXL"; prob = "75%"; }

  if (!mounted || !isOpen) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        background: "rgba(0,0,0,0.4)",
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
        animation: "fadeIn 0.2s ease-out forwards",
        display: "flex",
        justifyContent: "flex-end",
      }}
      onClick={closeOverlay}
    >
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }
      `}} />
      <div
        style={{
          width: "100%",
          maxWidth: "480px",
          height: "100%",
          background: "var(--color-bg)",
          animation: "slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards",
          display: "flex",
          flexDirection: "column",
          boxShadow: "-10px 0 30px rgba(0,0,0,0.1)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <header
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid var(--color-border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <h2 style={{ margin: 0, fontFamily: "var(--font-heading)", fontSize: "24px", color: "var(--color-primary)" }}>
            Fit & Sizing
          </h2>
          <button
            onClick={closeOverlay}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: "4px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--color-text-primary)",
            }}
            aria-label="Close size guide"
          >
            <X size={24} strokeWidth={1.5} />
          </button>
        </header>

        {/* Tabs */}
        <div style={{ display: "flex", borderBottom: "1px solid var(--color-border)", overflowX: "auto" }}>
          {[
            { id: "apparel" as const, label: "Apparel" },
            { id: "pants" as const, label: "Pants" },
            { id: "footwear" as const, label: "Footwear" },
            { id: "advisor" as const, label: "Advisor" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1,
                padding: "16px 12px",
                background: "none",
                border: "none",
                borderBottom: activeTab === tab.id ? "2px solid var(--color-accent)" : "2px solid transparent",
                fontWeight: activeTab === tab.id ? 600 : 400,
                color: activeTab === tab.id ? "var(--color-text-primary)" : "var(--color-text-secondary)",
                cursor: "pointer",
                fontSize: "13px",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                whiteSpace: "nowrap",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "24px", background: "var(--color-surface)" }}>
          {activeTab === "apparel" && (
            <div>
              <p style={{ fontSize: "14px", color: "var(--color-text-secondary)", marginBottom: "16px" }}>
                Measurements for tops and outerwear.
              </p>
              <div style={{ overflowX: "auto", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", background: "var(--color-bg)" }}>
                  <thead>
                    <tr style={{ background: "rgba(107,30,46,0.03)" }}>
                      {["Size", "Chest", "Waist", "Hip"].map((h) => (
                        <th key={h} style={{ padding: "12px", fontWeight: 600, color: "var(--color-text-secondary)", textAlign: "center", borderBottom: "1px solid var(--color-border)" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {APPAREL_SIZES.map((row, i) => (
                      <tr key={row.size} style={{ borderBottom: i < APPAREL_SIZES.length - 1 ? "1px solid var(--color-border)" : "none" }}>
                        <td style={{ padding: "12px", textAlign: "center", color: "var(--color-accent)", fontWeight: 600 }}>{row.size}</td>
                        <td style={{ padding: "12px", textAlign: "center" }}>{row.chest}</td>
                        <td style={{ padding: "12px", textAlign: "center" }}>{row.waist}</td>
                        <td style={{ padding: "12px", textAlign: "center" }}>{row.hip}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "pants" && (
            <div>
              <p style={{ fontSize: "14px", color: "var(--color-text-secondary)", marginBottom: "16px" }}>
                Measurements for trousers, jeans, and shorts.
              </p>
              <div style={{ overflowX: "auto", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", background: "var(--color-bg)" }}>
                  <thead>
                    <tr style={{ background: "rgba(107,30,46,0.03)" }}>
                      {["Size", "Waist", "Hip", "Inseam"].map((h) => (
                        <th key={h} style={{ padding: "12px", fontWeight: 600, color: "var(--color-text-secondary)", textAlign: "center", borderBottom: "1px solid var(--color-border)" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {PANTS_SIZES.map((row, i) => (
                      <tr key={row.size} style={{ borderBottom: i < PANTS_SIZES.length - 1 ? "1px solid var(--color-border)" : "none" }}>
                        <td style={{ padding: "12px", textAlign: "center", color: "var(--color-accent)", fontWeight: 600 }}>{row.size}</td>
                        <td style={{ padding: "12px", textAlign: "center" }}>{row.waist}</td>
                        <td style={{ padding: "12px", textAlign: "center" }}>{row.hip}</td>
                        <td style={{ padding: "12px", textAlign: "center" }}>{row.inseam}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "footwear" && (
            <div>
              <p style={{ fontSize: "14px", color: "var(--color-text-secondary)", marginBottom: "16px" }}>
                Footwear sizes and length conversions.
              </p>
              <div style={{ overflowX: "auto", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", background: "var(--color-bg)" }}>
                  <thead>
                    <tr style={{ background: "rgba(107,30,46,0.03)" }}>
                      {["UK", "EU", "US", "Length (cm)"].map((h) => (
                        <th key={h} style={{ padding: "12px", fontWeight: 600, color: "var(--color-text-secondary)", textAlign: "center", borderBottom: "1px solid var(--color-border)" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {FOOTWEAR_SIZES.map((row, i) => (
                      <tr key={row.uk} style={{ borderBottom: i < FOOTWEAR_SIZES.length - 1 ? "1px solid var(--color-border)" : "none" }}>
                        <td style={{ padding: "12px", textAlign: "center", color: "var(--color-accent)", fontWeight: 600 }}>{row.uk}</td>
                        <td style={{ padding: "12px", textAlign: "center" }}>{row.eu}</td>
                        <td style={{ padding: "12px", textAlign: "center" }}>{row.us}</td>
                        <td style={{ padding: "12px", textAlign: "center" }}>{row.cm}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "advisor" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              <p style={{ fontSize: "14px", color: "var(--color-text-secondary)", margin: 0 }}>
                Use our fit advisor to find your recommended size based on your body measurements.
              </p>
              
              {/* Height Slider */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "14px" }}>
                  <span style={{ fontWeight: 500, color: "var(--color-text-primary)" }}>Height</span>
                  <span style={{ fontWeight: 600, color: "var(--color-accent)" }}>{userHeight} cm</span>
                </div>
                <input
                  type="range"
                  min="140"
                  max="210"
                  value={userHeight}
                  onChange={(e) => setUserHeight(Number(e.target.value))}
                  style={{ width: "100%", accentColor: "var(--color-accent)" }}
                />
              </div>

              {/* Weight Slider */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "14px" }}>
                  <span style={{ fontWeight: 500, color: "var(--color-text-primary)" }}>Weight</span>
                  <span style={{ fontWeight: 600, color: "var(--color-accent)" }}>{userWeight} kg</span>
                </div>
                <input
                  type="range"
                  min="35"
                  max="130"
                  value={userWeight}
                  onChange={(e) => setUserWeight(Number(e.target.value))}
                  style={{ width: "100%", accentColor: "var(--color-accent)" }}
                />
              </div>

              {/* Result Box */}
              <div
                style={{
                  background: "rgba(107,30,46,0.03)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-md)",
                  padding: "20px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginTop: "8px"
                }}
              >
                <div>
                  <p style={{ fontSize: "13px", color: "var(--color-text-secondary)", margin: "0 0 4px 0" }}>Recommended Size</p>
                  <p style={{ fontSize: "28px", fontWeight: 700, margin: 0, color: "var(--color-text-primary)" }}>{recommended}</p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "var(--color-surface)", padding: "6px 12px", borderRadius: "20px", border: "1px solid var(--color-border)" }}>
                    <span style={{ display: "inline-block", width: "8px", height: "8px", borderRadius: "50%", background: "#10b981" }}></span>
                    <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-text-primary)" }}>{prob} Match</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Fit Tips */}
          <div style={{ marginTop: "40px", paddingTop: "24px", borderTop: "1px solid var(--color-border)" }}>
            <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "16px", fontWeight: 600, color: "var(--color-text-primary)", marginBottom: "16px" }}>Fit Tips</h3>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "10px" }}>
              <li style={{ display: "flex", gap: "10px", fontSize: "13px", color: "var(--color-text-secondary)", lineHeight: 1.5 }}>
                <span style={{ color: "var(--color-accent)" }}>•</span> For wide feet, we recommend going half a size up in footwear.
              </li>
              <li style={{ display: "flex", gap: "10px", fontSize: "13px", color: "var(--color-text-secondary)", lineHeight: 1.5 }}>
                <span style={{ color: "var(--color-accent)" }}>•</span> Apparel measurements are in inches. For a relaxed fit, size up.
              </li>
              <li style={{ display: "flex", gap: "10px", fontSize: "13px", color: "var(--color-text-secondary)", lineHeight: 1.5 }}>
                <span style={{ color: "var(--color-accent)" }}>•</span> Leather products have a break-in period of 3-5 wears.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
