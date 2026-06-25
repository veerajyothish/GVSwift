"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useToast } from "@/components/ui/Toast";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import AddressForm from "./AddressForm";

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

export default function AddressesClient({ initialAddresses }: AddressesClientProps) {
  const { toast } = useToast();
  const addresses = initialAddresses;
  
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [settingDefaultId, setSettingDefaultId] = useState<string | null>(null);
  const [showAddressModal, setShowAddressModal] = useState(false);

  // Synchronize state with backend by reloading
  const refreshAddresses = async () => {
    window.location.reload();
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
      const errMsg = err instanceof Error ? err.message : "Could not set default address";
      toast.error(errMsg, "Error");
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
      const errMsg = err instanceof Error ? err.message : "Could not delete address";
      toast.error(errMsg, "Delete Failed");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header action */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowAddressModal(true)}
          className="btn btn-primary btn-premium"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px 24px",
            borderRadius: "50px",
            cursor: "pointer",
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>add</span>
          Add New Address
        </button>
      </div>

      {/* Address List Grid */}
      {addresses.length === 0 ? (
        <Card className="p-8 flex flex-col items-center text-center gap-4" style={{ border: "1px solid var(--color-border)" }}>
          <span style={{ fontSize: "48px" }}>📍</span>
          <h2 className="text-xl font-semibold text-primary" style={{ fontFamily: "var(--font-heading)" }}>No addresses found</h2>
          <p className="text-sm text-secondary max-w-md">
            Add a shipping address to enable quick checkout for your premium orders.
          </p>
          <button
            onClick={() => setShowAddressModal(true)}
            className="btn btn-primary btn-premium mt-4"
            style={{ borderRadius: "50px" }}
          >
            Add Your First Address
          </button>
        </Card>
      ) : (
        <div className="address-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "24px" }}>
          {addresses.map((address) => (
            <div
              key={address.id}
              className={`rounded-xl p-6 border relative overflow-hidden group hover:border-primary transition-all duration-300 ${
                address.isDefault
                  ? "bg-surface shadow-md"
                  : "bg-surface-container-low"
              }`}
              style={{
                border: address.isDefault ? "1px solid var(--color-primary)" : "1px solid var(--color-border)",
                backgroundColor: address.isDefault ? "var(--color-surface)" : "var(--color-surface-container-low)",
              }}
            >
              {/* Default Badge */}
              {address.isDefault && (
                <div
                  className="absolute top-0 right-0 text-white px-4 py-1 rounded-bl-lg uppercase tracking-wider"
                  style={{
                    backgroundColor: "var(--color-primary)",
                    fontSize: "10px",
                    fontWeight: 600,
                  }}
                >
                  Default
                </div>
              )}

              {/* Recipient Header */}
              <div className="flex items-start justify-between mb-4 mt-2">
                <h3 className="text-lg font-bold text-primary font-heading" style={{ margin: 0, fontFamily: "var(--font-heading)" }}>
                  {address.fullName}
                </h3>
                <span
                  className="material-symbols-outlined text-secondary"
                  style={{
                    color: address.isDefault ? "var(--color-primary)" : "var(--color-text-secondary)",
                  }}
                >
                  {address.isDefault ? "home" : "place"}
                </span>
              </div>

              {/* Address Details */}
              <div className="text-sm text-secondary mb-4 space-y-1" style={{ lineHeight: "1.6" }}>
                <p className="m-0 text-primary">{address.line1}</p>
                {address.line2 && <p className="m-0 text-primary">{address.line2}</p>}
                <p className="m-0 text-primary">
                  {address.city}, {address.state} &ndash;{" "}
                  <strong className="text-accent">{address.pincode}</strong>
                </p>
              </div>

              {/* Phone Details */}
              <div className="flex items-center gap-2 mb-6 text-sm text-secondary">
                <span className="material-symbols-outlined text-secondary" style={{ fontSize: "16px" }}>call</span>
                <span>{address.phone}</span>
              </div>

              {/* COD Availability Alert */}
              {address.codBlocked && (
                <div
                  className="mb-6 p-3 rounded-lg border flex items-center gap-2"
                  style={{
                    backgroundColor: "var(--color-warning-bg)",
                    borderColor: "rgba(133, 79, 11, 0.15)",
                    color: "var(--color-warning)",
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>warning</span>
                  <span className="text-xs font-medium">COD unavailable for this pincode</span>
                </div>
              )}

              {/* Footer Actions */}
              <div className="flex gap-4 pt-4 border-t border-color-border items-center justify-between" style={{ borderTop: "1px solid var(--color-border)" }}>
                <div className="flex gap-4 items-center">
                  <Link
                    href={`/account/addresses/${address.id}/edit`}
                    className="text-xs font-semibold text-primary hover:text-accent uppercase tracking-wider transition-colors"
                  >
                    Edit
                  </Link>

                  {!address.isDefault && (
                    <>
                      <div className="h-3 w-[1px]" style={{ backgroundColor: "var(--color-border)" }}></div>
                      <button
                        onClick={() => handleSetDefault(address.id)}
                        disabled={deletingId === address.id || settingDefaultId === address.id}
                        className="text-xs font-semibold text-primary hover:text-accent uppercase tracking-wider transition-colors bg-transparent border-none p-0 cursor-pointer"
                      >
                        {settingDefaultId === address.id ? "Setting..." : "Set Default"}
                      </button>
                    </>
                  )}
                </div>

                <button
                  onClick={() => setConfirmDeleteId(address.id)}
                  disabled={deletingId === address.id || settingDefaultId === address.id}
                  className="text-xs font-semibold text-secondary hover:text-error uppercase tracking-wider transition-colors ml-auto bg-transparent border-none p-0 cursor-pointer"
                >
                  Delete
                </button>
              </div>
            </div>
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
              style={{ borderRadius: "50px" }}
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
              style={{ borderRadius: "50px" }}
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

      {/* Add New Address Modal */}
      {showAddressModal && (
        <Modal
          isOpen={showAddressModal}
          onClose={() => setShowAddressModal(false)}
          title="Add Address"
        >
          <AddressForm
            isModal={true}
            onSuccess={async () => {
              setShowAddressModal(false);
              await refreshAddresses();
            }}
            onCancel={() => setShowAddressModal(false)}
          />
        </Modal>
      )}
    </div>
  );
}
