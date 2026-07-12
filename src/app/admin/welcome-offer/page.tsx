"use client";

import React, { useState, useEffect } from "react";
import { Sparkles, Save, Info, RefreshCw } from "lucide-react";

interface WelcomeOfferData {
  id?: string;
  title: string;
  subtitle: string;
  offerText: string;
  offerSubtext: string;
  ctaText: string;
  ctaUrl: string;
  isActive: boolean;
}

export default function AdminWelcomeOfferPage() {
  const [formData, setFormData] = useState<WelcomeOfferData>({
    title: "",
    subtitle: "",
    offerText: "",
    offerSubtext: "",
    ctaText: "",
    ctaUrl: "",
    isActive: true,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/v1/admin/welcome-offer")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load welcome offer data");
        return res.json();
      })
      .then((data) => {
        if (data) {
          setFormData({
            title: data.title ?? "",
            subtitle: data.subtitle ?? "",
            offerText: data.offerText ?? "",
            offerSubtext: data.offerSubtext ?? "",
            ctaText: data.ctaText ?? "",
            ctaUrl: data.ctaUrl ?? "",
            isActive: data.isActive ?? false,
          });
        }
        setLoading(false);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load configuration");
        setLoading(false);
      });
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/v1/admin/welcome-offer", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error ?? "Failed to save configuration");
      }

      setSuccess("Welcome offer banner updated successfully!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save configuration");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "300px" }}>
        <RefreshCw size={24} className="animate-spin text-secondary" style={{ color: "var(--color-accent)" }} />
        <span style={{ marginLeft: "12px", fontSize: "14px", color: "var(--color-text-secondary)" }}>Loading welcome offer settings...</span>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px", maxWidth: "800px" }}>
      <header style={{ borderBottom: "1px solid var(--color-border)", paddingBottom: "20px" }}>
        <h1
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: "32px",
            fontWeight: 400,
            color: "var(--color-text-primary)",
            marginBottom: "6px",
          }}
        >
          Welcome Back Offer Settings
        </h1>
        <p style={{ fontSize: "14px", color: "var(--color-text-secondary)" }}>
          Configure the discount offer popup shown to users when they login to the store.
        </p>
      </header>

      {error && (
        <div
          style={{
            background: "var(--color-error-bg)",
            border: "1px solid var(--color-error)",
            borderRadius: "10px",
            color: "var(--color-error)",
            fontSize: "14px",
          }}
        >
          {error}
        </div>
      )}

      {success && (
        <div
          style={{
            background: "var(--color-success-bg)",
            border: "1px solid var(--color-success)",
            borderRadius: "10px",
            color: "var(--color-success)",
            fontSize: "14px",
          }}
        >
          {success}
        </div>
      )}

      <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        <div
          style={{
            background: "var(--color-bg)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-lg)",
            padding: "28px",
            display: "flex",
            flexDirection: "column",
            gap: "20px",
          }}
        >
          {/* Header Title */}
          <div>
            <label
              htmlFor="title"
              style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--color-text-primary)", marginBottom: "6px" }}
            >
              Header Title
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g. Welcome back! 🎉"
              required
              maxLength={100}
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: "8px",
                border: "1px solid var(--color-border)",
                fontSize: "14px",
                background: "var(--color-surface)",
                color: "var(--color-text-primary)",
                outline: "none",
              }}
            />
          </div>

          {/* Subtitle */}
          <div>
            <label
              htmlFor="subtitle"
              style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--color-text-primary)", marginBottom: "6px" }}
            >
              Header Subtitle
            </label>
            <input
              type="text"
              id="subtitle"
              name="subtitle"
              value={formData.subtitle}
              onChange={handleChange}
              placeholder="e.g. You have an exclusive deal waiting today."
              required
              maxLength={150}
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: "8px",
                border: "1px solid var(--color-border)",
                fontSize: "14px",
                background: "var(--color-surface)",
                color: "var(--color-text-primary)",
                outline: "none",
              }}
            />
          </div>

          {/* Offer Title */}
          <div>
            <label
              htmlFor="offerText"
              style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--color-text-primary)", marginBottom: "6px" }}
            >
              Offer Title / Discount Details
            </label>
            <input
              type="text"
              id="offerText"
              name="offerText"
              value={formData.offerText}
              onChange={handleChange}
              placeholder="e.g. FLAT ₹100 OFF on your first order"
              required
              maxLength={150}
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: "8px",
                border: "1px solid var(--color-border)",
                fontSize: "14px",
                background: "var(--color-surface)",
                color: "var(--color-text-primary)",
                outline: "none",
              }}
            />
          </div>

          {/* Offer Subtext / Dates */}
          <div>
            <label
              htmlFor="offerSubtext"
              style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--color-text-primary)", marginBottom: "6px" }}
            >
              Offer Subtext / Validity Info
            </label>
            <input
              type="text"
              id="offerSubtext"
              name="offerSubtext"
              value={formData.offerSubtext}
              onChange={handleChange}
              placeholder="e.g. Valid until July 25 · Applied automatically at checkout"
              required
              maxLength={200}
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: "8px",
                border: "1px solid var(--color-border)",
                fontSize: "14px",
                background: "var(--color-surface)",
                color: "var(--color-text-primary)",
                outline: "none",
              }}
            />
          </div>

          {/* CTA Link Text */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div>
              <label
                htmlFor="ctaText"
                style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--color-text-primary)", marginBottom: "6px" }}
              >
                Primary CTA Button Label
              </label>
              <input
                type="text"
                id="ctaText"
                name="ctaText"
                value={formData.ctaText}
                onChange={handleChange}
                placeholder="e.g. Shop Now"
                required
                maxLength={40}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: "8px",
                  border: "1px solid var(--color-border)",
                  fontSize: "14px",
                  background: "var(--color-surface)",
                  color: "var(--color-text-primary)",
                  outline: "none",
                }}
              />
            </div>
            <div>
              <label
                htmlFor="ctaUrl"
                style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--color-text-primary)", marginBottom: "6px" }}
              >
                Primary CTA Link URL
              </label>
              <input
                type="text"
                id="ctaUrl"
                name="ctaUrl"
                value={formData.ctaUrl}
                onChange={handleChange}
                placeholder="e.g. /products"
                required
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: "8px",
                  border: "1px solid var(--color-border)",
                  fontSize: "14px",
                  background: "var(--color-surface)",
                  color: "var(--color-text-primary)",
                  outline: "none",
                }}
              />
            </div>
          </div>

          {/* Active status */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "8px" }}>
            <input
              type="checkbox"
              id="isActive"
              name="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData((prev) => ({ ...prev, isActive: e.target.checked }))}
              style={{
                width: "18px",
                height: "18px",
                accentColor: "var(--color-accent)",
                cursor: "pointer",
              }}
            />
            <label
              htmlFor="isActive"
              style={{ fontSize: "14px", fontWeight: 500, color: "var(--color-text-primary)", cursor: "pointer" }}
            >
              Active and visible to logged-in customers
            </label>
          </div>
        </div>

        {/* Action Button */}
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button
            type="submit"
            disabled={saving}
            className="btn btn-primary"
            style={{
              padding: "12px 28px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "14px",
            }}
          >
            {saving ? (
              <RefreshCw size={16} className="animate-spin" />
            ) : (
              <Save size={16} />
            )}
            {saving ? "Saving Changes..." : "Save Welcome Offer"}
          </button>
        </div>
      </form>

      {/* Live Preview Panel */}
      <div style={{ marginTop: "16px" }}>
        <h3
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: "18px",
            fontWeight: 500,
            color: "var(--color-text-secondary)",
            marginBottom: "12px",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <Info size={16} />
          Live Preview
        </h3>

        {/* Scaled Preview Modal */}
        <div
          style={{
            background: "rgba(0,0,0,0.05)",
            border: "1px dashed var(--color-border)",
            borderRadius: "var(--radius-lg)",
            padding: "40px",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <div
            style={{
              width: "100%",
              background: "var(--color-surface)",
              borderRadius: "16px",
              overflow: "hidden",
              boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
              opacity: formData.isActive ? 1 : 0.6,
            }}
          >
            <div
              style={{
                background: "linear-gradient(135deg, var(--color-accent) 0%, color-mix(in oklch, var(--color-accent) 70%, black) 100%)",
                padding: "20px 20px 16px",
                textAlign: "center",
                color: "white",
              }}
            >
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "10px",
                  background: "rgba(255,255,255,0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 8px",
                }}
              >
                <Sparkles size={18} color="white" />
              </div>
              <h4 style={{ fontSize: "16px", fontWeight: 700, margin: "0 0 4px", color: "white" }}>
                {formData.title || "Welcome back! 🎉"}
              </h4>
              <p style={{ color: "rgba(255,255,255,0.8)", fontSize: "12px", margin: 0 }}>
                {formData.subtitle || "You have an exclusive deal waiting today."}
              </p>
            </div>
            <div style={{ padding: "16px 20px 20px" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  background: "var(--color-error-bg)",
                  border: "1px solid var(--color-error)",
                  borderRadius: "10px",
                  padding: "10px 12px",
                  marginBottom: "16px",
                }}
              >
                <span style={{ fontSize: "16px" }}>🏷️</span>
                <div>
                  <p style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-accent)", margin: 0 }}>
                    {formData.offerText || "FLAT ₹100 OFF on your first order"}
                  </p>
                  <p style={{ fontSize: "11px", color: "var(--color-text-secondary)", margin: "2px 0 0" }}>
                    {formData.offerSubtext || "Valid until July 25 · Applied automatically at checkout"}
                  </p>
                </div>
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <span
                  style={{
                    flex: 1,
                    background: "var(--color-accent)",
                    color: "white",
                    fontWeight: 600,
                    fontSize: "12px",
                    padding: "10px",
                    borderRadius: "8px",
                    textAlign: "center",
                  }}
                >
                  {formData.ctaText || "Shop Now"}
                </span>
                <span
                  style={{
                    flex: 1,
                    background: "var(--color-surface-offset)",
                    color: "var(--color-accent)",
                    fontWeight: 600,
                    fontSize: "12px",
                    padding: "10px",
                    borderRadius: "8px",
                    textAlign: "center",
                  }}
                >
                  Maybe Later
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
