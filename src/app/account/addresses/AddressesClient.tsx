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
  const [showForm, setShowForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  
  const [formData, setFormData] = useState(defaultFormData);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
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
    setShowForm(true);
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
    setShowForm(true);
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
        if (data.error && (data.error.includes("ship to this pincode") || data.error.includes("serviceable"))) {
          setFieldErrors((prev) => ({ ...prev, pincode: data.error }));
          throw new Error(data.error);
        }
        throw new Error(data.error || "Failed to save address");
      }

      toast.success(isEdit ? "Address updated successfully" : "Address created successfully");
      setShowForm(false);
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
    <div className="flex flex-col gap-5">
      {/* Header action / form toggle */}
      {!showForm && (
        <div className="flex justify-end">
          <Button variant="primary" onClick={handleOpenAdd}>
            + Add New Address
          </Button>
        </div>
      )}

      {/* Inline Form Add / Edit */}
      {showForm && (
        <div className="card p-6 flex flex-col gap-5">
          <div className="border-b border-color-border pb-3 mb-2" style={{ borderBottom: "1px solid var(--color-border)", paddingBottom: "12px", marginBottom: "8px" }}>
            <h2 className="text-lg font-semibold text-primary">
              {editingAddress ? "Edit Address Details" : "Add a New Address"}
            </h2>
            <p className="text-xs text-secondary">
              Please enter your full details. Pincode validation will check serviceability automatically.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
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

            <div className="flex items-center gap-2 mt-4">
              <input
                type="checkbox"
                id="isDefault"
                checked={formData.isDefault}
                onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                className="icon-xs"
                style={{
                  cursor: "pointer",
                  accentColor: "var(--color-accent)",
                }}
              />
              <label
                htmlFor="isDefault"
                className="text-sm text-primary"
                style={{
                  cursor: "pointer",
                  userSelect: "none",
                }}
              >
                Make this my default shipping address
              </label>
            </div>

            <div className="admin-divider mt-12" />

            <div className="flex justify-end gap-3">
              <Button
                variant="secondary"
                type="button"
                onClick={() => setShowForm(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                type="submit"
                loading={submitting}
                className="btn-min-w-160"
              >
                {editingAddress ? "Save Changes" : "Add Address"}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Address List Grid */}
      {addresses.length === 0 ? (
        <Card className="p-6 flex flex-col items-center text-center gap-4">
          <span style={{ fontSize: "48px" }}>📍</span>
          <h2 className="text-xl font-semibold text-primary">No addresses found</h2>
          <p className="text-sm text-secondary max-w-xl">
            Add a shipping address to enable quick checkout for your cash on delivery orders.
          </p>
          {!showForm && (
            <Button variant="primary" onClick={handleOpenAdd} className="mt-8">
              Add Your First Address
            </Button>
          )}
        </Card>
      ) : (
        <div className="address-grid">
          {addresses.map((address) => (
            <Card
              key={address.id}
              className={`p-5 flex flex-col gap-4 relative ${address.isDefault ? "address-card-default" : ""}`}
            >
              {/* Badges Container */}
              <div className="flex flex-wrap gap-2 absolute" style={{ top: "16px", right: "16px" }}>
                {address.isDefault && (
                  <span className="badge-default">
                    Default
                  </span>
                )}
                {address.codBlocked && (
                  <span className="badge-warning">
                    COD Unavailable
                  </span>
                )}
              </div>

              {/* Recipient Details */}
              <div>
                <h3 className={`text-lg font-semibold text-primary ${address.isDefault || address.codBlocked ? "address-title-with-badges" : ""}`}>
                  {address.fullName}
                </h3>
                <p className="text-sm text-secondary mt-4">
                  Phone: {address.phone}
                </p>
              </div>

              {/* Address Details */}
              <div className="text-sm text-primary" style={{ lineHeight: "1.6" }}>
                <p>{address.line1}</p>
                {address.line2 && <p>{address.line2}</p>}
                <p>
                  {address.city}, {address.state} &ndash;{" "}
                  <strong className="text-accent">{address.pincode}</strong>
                </p>
              </div>

              {/* Footer Actions */}
              <div className="address-card-footer">
                <Button
                  variant="secondary"
                  onClick={() => handleOpenEdit(address)}
                  disabled={deletingId === address.id || settingDefaultId === address.id}
                  className="btn-sm"
                >
                  Edit
                </Button>
                <Button
                  variant="danger"
                  onClick={() => setConfirmDeleteId(address.id)}
                  disabled={deletingId === address.id || settingDefaultId === address.id}
                  className="btn-sm"
                >
                  Delete
                </Button>
                {!address.isDefault && (
                  <Button
                    variant="secondary"
                    onClick={() => handleSetDefault(address.id)}
                    loading={settingDefaultId === address.id}
                    disabled={deletingId === address.id || settingDefaultId === address.id}
                    className="btn-sm"
                  >
                    Set as Default
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!confirmDeleteId}
        onClose={() => setConfirmDeleteId(null)}
        title="Delete Address"
        footer={
          <div className="flex justify-end gap-3 w-full">
            <Button
              variant="secondary"
              onClick={() => setConfirmDeleteId(null)}
              disabled={deletingId !== null}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={async () => {
                if (confirmDeleteId) {
                  await handleDelete(confirmDeleteId);
                  setConfirmDeleteId(null);
                }
              }}
              loading={deletingId === confirmDeleteId}
            >
              Delete Address
            </Button>
          </div>
        }
      >
        <p className="text-sm text-secondary">
          Are you sure you want to permanently delete this shipping address? This action cannot be undone.
        </p>
      </Modal>
    </div>
  );
}
