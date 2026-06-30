"use client";

/**
 * ProfileForm — PDF p.8/9/25/26:
 * Two cards stacked:
 * 1. Personal Information: avatar circle left, 2-col fields (First Name, Last Name), 
 *    Email, Phone. "EDIT" pill button top-right. Readonly by default, editable on click.
 * 2. Security: Current Password / New Password / Confirm New Password + "UPDATE PASSWORD" pill CTA.
 *    PDF p.26 mobile: Password row "Last updated 3 months ago" + UPDATE pill, 2FA row + ENABLE pill.
 */
import React, { useState } from "react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

interface ProfileFormProps {
  initialUser: {
    name: string;
    email: string;
    phone: string;
    createdAt: string;
  };
}

export default function ProfileForm({ initialUser }: ProfileFormProps) {
  const { toast } = useToast();

  /* ── Personal info state ─── */
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(initialUser.name);
  const [phone, setPhone] = useState(initialUser.phone);
  const [saving, setSaving] = useState(false);

  /* ── Password state ─── */
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwLoading, setPwLoading] = useState(false);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/v1/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");
      toast.success("Profile updated successfully.", "Saved");
      setEditing(false);
    } catch (err: unknown) {
      toast.error((err as Error).message || "Could not save profile.", "Error");
    } finally { setSaving(false); }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match.", "Error"); return;
    }
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters.", "Error"); return;
    }
    setPwLoading(true);
    try {
      const res = await fetch("/api/v1/account/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update password");
      toast.success("Password updated successfully.", "Done");
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
    } catch (err: unknown) {
      toast.error((err as Error).message || "Could not update password.", "Error");
    } finally { setPwLoading(false); }
  };

  /* Split name into first/last for display */
  const firstName = name.split(" ")[0] || "";
  const lastName = name.split(" ").slice(1).join(" ") || "";

  const fieldStyle: React.CSSProperties = {
    width: "100%",
    padding: "12px 18px",
    borderRadius: "9999px",
    border: "1px solid var(--color-border)",
    background: editing ? "var(--color-bg)" : "var(--color-surface)",
    fontSize: "15px",
    color: "var(--color-text-primary)",
    fontFamily: "var(--font-body)",
    outline: "none",
    transition: "border-color 0.15s",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "11px",
    fontWeight: 600,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "var(--color-text-secondary)",
    marginBottom: "8px",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>

      {/* ── Personal Information Card ── */}
      <div
        style={{
          background: "var(--color-bg)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-lg)",
          overflow: "hidden",
        }}
      >
        {/* Card header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "20px 24px",
            borderBottom: "1px solid var(--color-border)",
          }}
        >
          <h2
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "20px",
              fontWeight: 400,
              fontStyle: "italic",
              color: "var(--color-accent)",
              margin: 0,
            }}
          >
            Personal Information
          </h2>
          <button
            onClick={() => setEditing(!editing)}
            disabled={saving}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
              padding: "6px 16px",
              border: "1px solid var(--color-border)",
              borderRadius: "9999px",
              background: "transparent",
              fontSize: "12px",
              fontWeight: 600,
              letterSpacing: "0.05em",
              textTransform: "uppercase",
              color: "var(--color-text-secondary)",
              cursor: saving ? "not-allowed" : "pointer",
              opacity: saving ? 0.6 : 1,
            }}
          >
            ✏ {editing ? "Cancel" : "Edit"}
          </button>
        </div>

        {/* Card body */}
        <form onSubmit={handleSaveProfile} style={{ padding: "28px 24px", display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Avatar + fields row — PDF p.8 */}
          <div style={{ display: "flex", gap: "24px", alignItems: "flex-start", flexWrap: "wrap" }}>
            {/* Avatar circle */}
            <div
              style={{
                width: "64px",
                height: "64px",
                borderRadius: "50%",
                background: "var(--color-surface)",
                border: "2px solid var(--color-border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "24px",
                flexShrink: 0,
                color: "var(--color-text-secondary)",
              }}
            >
              {firstName.charAt(0).toUpperCase() || "👤"}
            </div>

            <div style={{ flex: 1, minWidth: "280px", display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* First / Last name row */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={labelStyle}>First Name</label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setName(`${e.target.value} ${lastName}`.trim())}
                    disabled={!editing || saving}
                    style={fieldStyle}
                    placeholder="Eleanor"
                  />
                </div>
                <div>
                  <label style={labelStyle}>Last Name</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setName(`${firstName} ${e.target.value}`.trim())}
                    disabled={!editing || saving}
                    style={fieldStyle}
                    placeholder="Vance"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label style={labelStyle}>Email Address</label>
                <div style={{ position: "relative" }}>
                  <input
                    type="email"
                    value={initialUser.email}
                    disabled
                    style={{ ...fieldStyle, paddingRight: "44px", background: "var(--color-surface)" }}
                  />
                  <span
                    style={{
                      position: "absolute",
                      right: "16px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "var(--color-success)",
                      fontSize: "16px",
                    }}
                  >✓</span>
                </div>
              </div>

              {/* Phone */}
              <div>
                <label style={labelStyle}>Phone Number</label>
                <input
                  type="tel"
                  value={editing ? phone : (phone || "+91 ••••• •••••")}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={!editing || saving}
                  style={fieldStyle}
                  placeholder={editing ? "+91 ••••• •••••" : ""}
                />
              </div>
            </div>
          </div>

          {editing && (
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <Button type="submit" variant="primary" loading={saving} className="btn-premium" style={{ minWidth: "160px" }}>
                Save Changes
              </Button>
            </div>
          )}
        </form>
      </div>

      {/* ── Security Card — PDF p.9/26 ── */}
      <div
        style={{
          background: "var(--color-bg)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-lg)",
          overflow: "hidden",
        }}
      >
        <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--color-border)" }}>
          <h2
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "20px",
              fontWeight: 400,
              fontStyle: "italic",
              color: "var(--color-accent)",
              marginBottom: "4px",
            }}
          >
            Security
          </h2>
          <p style={{ fontSize: "13px", color: "var(--color-text-secondary)" }}>
            Update your password to keep your account secure.
          </p>
        </div>

        <form onSubmit={handleUpdatePassword} style={{ padding: "28px 24px", display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <label style={labelStyle}>Current Password</label>
            <input type="password" className="input-field" value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)} placeholder="••••••••" autoComplete="current-password" disabled={pwLoading} />
          </div>
          <div>
            <label style={labelStyle}>New Password</label>
            <input type="password" className="input-field" value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)} placeholder="Enter new password" autoComplete="new-password" disabled={pwLoading} />
          </div>
          <div>
            <label style={labelStyle}>Confirm New Password</label>
            <input type="password" className="input-field" value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm new password" autoComplete="new-password" disabled={pwLoading} />
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <Button type="submit" variant="primary" loading={pwLoading} className="btn-premium" style={{ minWidth: "180px" }}>
              Update Password
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}