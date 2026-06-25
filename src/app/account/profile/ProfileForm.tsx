"use client";

import React, { useState } from "react";
import { useToast } from "@/components/ui/Toast";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { SignOutButton } from "@/components/ui/SignOutButton";

interface ProfileFormProps {
  initialUser: {
    name: string | null;
    email: string;
    phone: string | null;
    createdAt: string;
  };
}

export default function ProfileForm({ initialUser }: ProfileFormProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: initialUser.name || "",
    phone: initialUser.phone || "",
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const displayName = formData.name.trim() || initialUser.email;
  
  const getInitials = () => {
    const nameToUse = formData.name.trim() ? formData.name.trim() : initialUser.email.split("@")[0];
    const parts = nameToUse.split(/[\s._-]+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    if (parts.length === 1 && parts[0].length >= 2) {
      return (parts[0][0] + parts[0][1]).toUpperCase();
    }
    return (nameToUse[0] || "?").toUpperCase();
  };

  const initials = getInitials();

  const formattedDate = new Date(initialUser.createdAt).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const validate = () => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = "Name is required";
    } else if (formData.name.length > 100) {
      errors.name = "Name must be at most 100 characters";
    }

    if (!formData.phone.trim()) {
      errors.phone = "Phone number is required";
    } else if (!/^[6-9]\d{9}$/.test(formData.phone.trim())) {
      errors.phone = "Enter a valid 10-digit Indian mobile number (starts with 6-9)";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/v1/account/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.code === "CONFLICT") {
          setFieldErrors((prev) => ({ ...prev, phone: data.error }));
        }
        throw new Error(data.error || "Failed to update profile");
      }

      toast.success("Profile updated successfully");
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "An error occurred while updating profile";
      toast.error(errMsg, "Error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="p-6 bg-surface border border-color-border rounded-lg shadow-sm" style={{ border: "1px solid var(--color-border)" }}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* Profile Header Block */}
        <div className="flex items-center gap-4 p-4 rounded-xl" style={{ backgroundColor: "color-mix(in srgb, var(--color-primary) 4%, var(--color-surface))", border: "1px solid var(--color-border)" }}>
          <div
            className="flex items-center justify-center rounded-full font-bold text-white shadow-sm"
            style={{
              width: "60px",
              height: "60px",
              fontSize: "20px",
              backgroundColor: "var(--color-primary)",
              letterSpacing: "0.05em",
              flexShrink: 0,
            }}
          >
            {initials}
          </div>
          <div>
            <h2 className="text-lg font-bold text-primary" style={{ margin: 0, fontFamily: "var(--font-heading)" }}>
              {displayName}
            </h2>
            <p className="text-xs text-secondary" style={{ margin: "4px 0 0 0" }}>
              GVSwift Premium Member
            </p>
          </div>
        </div>

        {/* Email - Read-Only */}
        <div className="input-group">
          <label className="input-label" style={{ fontFamily: "var(--font-body)", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", fontSize: "12px", color: "var(--color-text-secondary)" }}>Email Address</label>
          <input
            type="text"
            value={initialUser.email}
            disabled
            className="input-field"
            style={{
              backgroundColor: "rgba(86, 25, 34, 0.02)",
              cursor: "not-allowed",
              color: "var(--color-text-secondary)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-md)",
              padding: "10px 14px",
              fontSize: "14px",
              width: "100%",
            }}
          />
          <span className="text-xs text-secondary mt-1">
            Email address cannot be changed directly for security.
          </span>
        </div>

        {/* Name - Editable */}
        <Input
          label="Full Name"
          placeholder="Enter your name"
          value={formData.name}
          error={fieldErrors.name}
          required
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="input-field-premium"
        />

        {/* Phone - Editable */}
        <Input
          label="Mobile Number"
          placeholder="10-digit Indian number"
          value={formData.phone}
          error={fieldErrors.phone}
          required
          onChange={(e) =>
            setFormData({ ...formData, phone: e.target.value.replace(/\D/g, "") })
          }
          className="input-field-premium"
        />

        {/* Member Since - Display */}
        <div className="flex justify-between items-center py-3 border-t border-b border-color-border my-2" style={{ borderTop: "1px solid var(--color-border)", borderBottom: "1px solid var(--color-border)" }}>
          <span className="text-sm font-medium text-secondary">Member Since</span>
          <span className="text-sm font-semibold text-primary">{formattedDate}</span>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center mt-4 pt-6 border-t border-color-border" style={{ borderTop: "1px solid var(--color-border)" }}>
          <SignOutButton
            className="btn btn-secondary"
            style={{
              padding: "10px 24px",
              borderRadius: "50px",
              fontWeight: 600,
              fontSize: "13px",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            Sign Out
          </SignOutButton>
          <Button
            variant="primary"
            type="submit"
            loading={submitting}
            className="btn-premium btn-min-w-160"
            style={{
              padding: "10px 28px",
              borderRadius: "50px",
              fontWeight: 600,
              fontSize: "13px",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            Save Changes
          </Button>
        </div>
      </form>
    </Card>
  );
}
