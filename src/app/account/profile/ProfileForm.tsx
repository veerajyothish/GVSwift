"use client";

import React, { useState } from "react";
import { useToast } from "@/components/ui/Toast";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

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
    <Card className="p-6 bg-surface border border-color-border rounded-lg shadow-sm">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Profile Header Block */}
        <div className="flex items-center gap-4 p-4 rounded-lg" style={{ backgroundColor: "color-mix(in oklch, var(--color-primary) 4%, var(--color-surface))", border: "1px solid var(--color-border)" }}>
          <div
            className="flex items-center justify-center rounded-full font-bold text-white shadow-sm"
            style={{
              width: "60px",
              height: "60px",
              fontSize: "22px",
              backgroundColor: "var(--color-primary)",
              letterSpacing: "0.05em",
              flexShrink: 0,
            }}
          >
            {initials}
          </div>
          <div>
            <h2 className="text-lg font-bold text-primary animate-fade-in" style={{ margin: 0 }}>
              {displayName}
            </h2>
            <p className="text-13 text-secondary" style={{ margin: "2px 0 0 0" }}>
              GVSwift Member
            </p>
          </div>
        </div>

        {/* Email - Read-Only */}
        <div className="input-group">
          <label className="input-label">Email Address</label>
          <input
            type="text"
            value={initialUser.email}
            disabled
            className="input-field"
            style={{
              backgroundColor: "rgba(86, 25, 34, 0.03)",
              cursor: "not-allowed",
              color: "var(--color-text-secondary)",
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
        />

        {/* Member Since - Display */}
        <div className="flex justify-between items-center py-2 border-t border-b border-color-border my-2" style={{ borderTop: "1px solid var(--color-border)", borderBottom: "1px solid var(--color-border)", padding: "8px 0" }}>
          <span className="text-sm font-medium text-secondary">Member Since</span>
          <span className="text-sm font-semibold text-primary">{formattedDate}</span>
        </div>

        <div className="flex justify-end mt-4">
          <Button
            variant="primary"
            type="submit"
            loading={submitting}
            className="btn-min-w-160"
            style={{
              backgroundColor: "var(--color-accent)",
              color: "var(--color-accent-text)",
              padding: "10px 24px",
              borderRadius: "var(--radius-md)",
              fontWeight: 600,
            }}
          >
            Save Changes
          </Button>
        </div>
      </form>
    </Card>
  );
}
