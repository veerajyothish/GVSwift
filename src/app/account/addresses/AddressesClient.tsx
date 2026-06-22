"use client";

import React, { useState } from "react";
import { useToast } from "@/components/ui/Toast";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";

interface Address {
  id: string;
  fullName: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  isDefault: boolean;
  codBlocked: boolean;
}

interface AddressesClientProps {
  initialAddresses: Address[];
  userId: string;
}

const defaultFormData = {
  fullName: "",
  phone: "",
  pincode: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  isDefault: false,
};

export default function AddressesClient({ initialAddresses }: AddressesClientProps) {
  const { toast } = useToast();
  const [addresses, setAddresses] = useState<Address[]>(initialAddresses);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  
  const [formData, setFormData] = useState(defaultFormData);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [settingDefaultId, setSettingDefaultId] = useState<string | null>(null);

  // Synchronize state with backend
  const refreshAddresses = async () => {
    try {
      const res = await fetch("/api/v1/addresses");
      if (res.ok) {
        const data = await res.json();
        setAddresses(data);
      }
    } catch (err) {
      console.error("Failed to refresh addresses:", err);
    }
  };

  const handleOpenAdd = () => {
    setEditingAddress(null);
    setFormData(defaultFormData);
    setFieldErrors({});
    setIsModalOpen(true);
  };

  const handleOpenEdit = (address: Address) => {
    setEditingAddress(address);
    setFormData({
      fullName: address.fullName,
      phone: address.phone,
      pincode: address.pincode,
      line1: address.line1,
      line2: address.line2 || "",
      city: address.city,
      state: address.state,
      isDefault: address.isDefault,
    });
    setFieldErrors({});
    setIsModalOpen(true);
  };

  const validate = () => {
    const errors: Record<string, string> = {};

    if (!formData.fullName.trim()) {
      errors.fullName = "Full name is required";
    } else if (formData.fullName.length > 100) {
      errors.fullName = "Full name must be at most 100 characters";
    }

    if (!formData.phone.trim()) {
      errors.phone = "Phone number is required";
    } else if (!/^[6-9]\d{9}$/.test(formData.phone.trim())) {
      errors.phone = "Enter a valid 10-digit Indian mobile number (starts with 6-9)";
    }

    if (!formData.pincode.trim()) {
      errors.pincode = "Pincode is required";
    } else if (!/^\d{6}$/.test(formData.pincode.trim())) {
      errors.pincode = "Pincode must be exactly 6 digits";
    }

    if (!formData.line1.trim()) {
      errors.line1 = "Address line 1 is required";
    } else if (formData.line1.length > 200) {
      errors.line1 = "Address line 1 must be at most 200 characters";
    }

    if (formData.line2 && formData.line2.length > 200) {
      errors.line2 = "Address line 2 must be at most 200 characters";
    }

    if (!formData.city.trim()) {
      errors.city = "City is required";
    } else if (formData.city.length > 100) {
      errors.city = "City must be at most 100 characters";
    }

    if (!formData.state.trim()) {
      errors.state = "State is required";
    } else if (formData.state.length > 100) {
      errors.state = "State must be at most 100 characters";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);

    try {
      const isEdit = !!editingAddress;
      const url = isEdit ? `/api/v1/addresses/${editingAddress.id}` : "/api/v1/addresses";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        // Specifically map serviceability/pincode errors to the pincode field
        if (data.error && (data.error.includes("ship to this pincode") || data.error.includes("serviceable"))) {
          setFieldErrors((prev) => ({ ...prev, pincode: data.error }));
          throw new Error(data.error);
        }
        throw new Error(data.error || "Failed to save address");
      }

      toast.success(isEdit ? "Address updated successfully" : "Address created successfully");
      setIsModalOpen(false);
      await refreshAddresses();
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || "An error occurred while saving the address", "Error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSetDefault = async (addressId: string) => {
    setSettingDefaultId(addressId);

    try {
      const res = await fetch(`/api/v1/addresses/${addressId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isDefault: true }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to set default address");
      }

      toast.success("Default address updated");
      await refreshAddresses();
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || "Could not set default address", "Error");
    } finally {
      setSettingDefaultId(null);
    }
  };

  const handleDelete = async (addressId: string) => {
    if (!confirm("Are you sure you want to delete this address?")) return;

    setDeletingId(addressId);

    try {
      const res = await fetch(`/api/v1/addresses/${addressId}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to delete address");
      }

      toast.success("Address deleted successfully");
      await refreshAddresses();
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || "Could not delete address", "Delete Failed");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header action */}
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <Button variant="primary" onClick={handleOpenAdd} style={{ padding: "10px 24px" }}>
          + Add New Address
        </Button>
      </div>

      {/* Address List Grid */}
      {addresses.length === 0 ? (
        <Card
          style={{
            padding: "48px 24px",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "16px",
            backgroundColor: "var(--color-surface)",
          }}
        >
          <span style={{ fontSize: "48px" }}>📍</span>
          <h2 className="text-xl font-semibold" style={{ color: "var(--color-text-primary)" }}>No addresses found</h2>
          <p style={{ color: "var(--color-text-secondary)", maxWidth: "400px", fontSize: "14px" }}>
            Add a shipping address to enable quick checkout for your cash on delivery orders.
          </p>
          <Button variant="primary" onClick={handleOpenAdd} style={{ marginTop: "8px" }}>
            Add Your First Address
          </Button>
        </Card>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "24px" }} className="md:grid-cols-2">
          {addresses.map((address) => (
            <Card
              key={address.id}
              style={{
                padding: "24px",
                backgroundColor: "var(--color-surface)",
                borderColor: address.isDefault ? "var(--color-accent)" : "var(--color-border)",
                display: "flex",
                flexDirection: "column",
                gap: "16px",
                position: "relative",
              }}
            >
              {/* Badges Container */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", position: "absolute", top: "16px", right: "16px" }}>
                {address.isDefault && (
                  <span
                    style={{
                      backgroundColor: "rgba(212, 169, 67, 0.12)",
                      border: "1px solid var(--color-accent)",
                      color: "var(--color-accent)",
                      fontSize: "11px",
                      fontWeight: 600,
                      padding: "2px 8px",
                      borderRadius: "var(--radius-sm)",
                      textTransform: "uppercase",
                    }}
                  >
                    Default
                  </span>
                )}
                {address.codBlocked && (
                  <span
                    style={{
                      backgroundColor: "var(--color-warning-bg)",
                      border: "1px solid var(--color-warning)",
                      color: "var(--color-warning)",
                      fontSize: "11px",
                      fontWeight: 600,
                      padding: "2px 8px",
                      borderRadius: "var(--radius-sm)",
                    }}
                  >
                    COD Unavailable
                  </span>
                )}
              </div>

              {/* Recipient Details */}
              <div>
                <h3 className="text-lg font-semibold" style={{ color: "var(--color-text-primary)", paddingRight: address.isDefault || address.codBlocked ? "120px" : "0" }}>
                  {address.fullName}
                </h3>
                <p style={{ color: "var(--color-text-secondary)", fontSize: "14px", marginTop: "4px" }}>
                  Phone: {address.phone}
                </p>
              </div>

              {/* Address Details */}
              <div style={{ color: "var(--color-text-primary)", fontSize: "14px", lineHeight: "1.6" }}>
                <p>{address.line1}</p>
                {address.line2 && <p>{address.line2}</p>}
                <p>
                  {address.city}, {address.state} &ndash;{" "}
                  <strong style={{ color: "var(--color-accent)" }}>{address.pincode}</strong>
                </p>
              </div>

              {/* Footer Actions */}
              <div style={{ display: "flex", gap: "12px", marginTop: "auto", borderTop: "1px solid var(--color-border)", paddingTop: "16px", flexWrap: "wrap", alignItems: "center" }}>
                <Button
                  variant="secondary"
                  onClick={() => handleOpenEdit(address)}
                  disabled={deletingId === address.id || settingDefaultId === address.id}
                  style={{ minHeight: "36px", height: "36px", padding: "0 16px", fontSize: "13px" }}
                >
                  Edit
                </Button>
                <Button
                  variant="danger"
                  onClick={() => handleDelete(address.id)}
                  loading={deletingId === address.id}
                  disabled={deletingId === address.id || settingDefaultId === address.id}
                  style={{ minHeight: "36px", height: "36px", padding: "0 16px", fontSize: "13px" }}
                >
                  Delete
                </Button>
                {!address.isDefault && (
                  <Button
                    variant="secondary"
                    onClick={() => handleSetDefault(address.id)}
                    loading={settingDefaultId === address.id}
                    disabled={deletingId === address.id || settingDefaultId === address.id}
                    style={{ minHeight: "36px", height: "36px", padding: "0 16px", fontSize: "13px", border: "1px solid var(--color-accent)", color: "var(--color-accent)" }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "var(--color-accent)";
                      e.currentTarget.style.color = "var(--color-accent-text)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                      e.currentTarget.style.color = "var(--color-accent)";
                    }}
                  >
                    Set as Default
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add / Edit Address Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingAddress ? "Edit Address" : "Add New Address"}
        footer={
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", width: "100%" }}>
            <Button
              variant="secondary"
              onClick={() => setIsModalOpen(false)}
              disabled={submitting}
              style={{ minHeight: "44px" }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmit}
              loading={submitting}
              style={{ minHeight: "44px", minWidth: "120px" }}
            >
              {editingAddress ? "Save Changes" : "Add Address"}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "16px" }} className="md:grid-cols-2">
            <Input
              label="Full Name"
              placeholder="e.g. John Doe"
              value={formData.fullName}
              error={fieldErrors.fullName}
              required
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            />
            <Input
              label="Mobile Number"
              placeholder="10-digit Indian number"
              value={formData.phone}
              error={fieldErrors.phone}
              required
              onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, "") })}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "16px" }} className="md:grid-cols-3">
            <Input
              label="Pincode"
              placeholder="6-digit PIN code"
              value={formData.pincode}
              error={fieldErrors.pincode}
              required
              onChange={(e) => setFormData({ ...formData, pincode: e.target.value.replace(/\D/g, "") })}
            />
            <Input
              label="City"
              placeholder="e.g. Bangalore"
              value={formData.city}
              error={fieldErrors.city}
              required
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            />
            <Input
              label="State"
              placeholder="e.g. Karnataka"
              value={formData.state}
              error={fieldErrors.state}
              required
              onChange={(e) => setFormData({ ...formData, state: e.target.value })}
            />
          </div>

          <Input
            label="Address Line 1"
            placeholder="Flat, House no., Building, Company, Apartment"
            value={formData.line1}
            error={fieldErrors.line1}
            required
            onChange={(e) => setFormData({ ...formData, line1: e.target.value })}
          />

          <Input
            label="Address Line 2 (Optional)"
            placeholder="Area, Street, Sector, Village"
            value={formData.line2}
            error={fieldErrors.line2}
            onChange={(e) => setFormData({ ...formData, line2: e.target.value })}
          />

          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "8px" }}>
            <input
              type="checkbox"
              id="isDefault"
              checked={formData.isDefault}
              onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
              style={{
                width: "18px",
                height: "18px",
                cursor: "pointer",
                accentColor: "var(--color-accent)",
              }}
            />
            <label
              htmlFor="isDefault"
              style={{
                fontSize: "14px",
                color: "var(--color-text-primary)",
                cursor: "pointer",
                userSelect: "none",
              }}
            >
              Make this my default shipping address
            </label>
          </div>
        </form>
      </Modal>
    </div>
  );
}
