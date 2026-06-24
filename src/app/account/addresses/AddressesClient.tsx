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
    <div className="flex flex-col gap-5">
      {/* Header action */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowAddressModal(true)}
          className="btn btn-primary"
          style={{ display: "inline-flex", alignItems: "center", borderRadius: "50px", cursor: "pointer" }}
        >
          + Add New Address
        </button>
      </div>

      {/* Address List Grid */}
      {addresses.length === 0 ? (
        <Card className="p-6 flex flex-col items-center text-center gap-4">
          <span style={{ fontSize: "48px" }}>📍</span>
          <h2 className="text-xl font-semibold text-primary">No addresses found</h2>
          <p className="text-sm text-secondary max-w-xl">
            Add a shipping address to enable quick checkout for your cash on delivery orders.
          </p>
          <button
            onClick={() => setShowAddressModal(true)}
            className="btn btn-primary mt-8"
            style={{ borderRadius: "50px", cursor: "pointer" }}
          >
            Add Your First Address
          </button>
        </Card>
      ) : (
        <div className="address-grid" style={{ display: "grid", gridTemplateColumns: "1fr", gap: "20px" }}>
          {addresses.map((address) => (
            <Card
              key={address.id}
              className={`p-5 flex flex-col gap-4 relative ${address.isDefault ? "address-card-default" : ""}`}
              style={{ borderLeft: address.isDefault ? "4px solid var(--color-primary)" : undefined }}
            >
              {/* Badges Container */}
              <div className="flex flex-wrap gap-2 absolute" style={{ top: "16px", right: "16px" }}>
                {address.isDefault && (
                  <span className="badge-default" style={{ backgroundColor: "var(--color-primary)", color: "#fff", padding: "2px 8px", borderRadius: "4px", fontSize: "12px" }}>
                    Default
                  </span>
                )}
                {address.codBlocked && (
                  <span className="badge-warning" style={{ backgroundColor: "var(--color-warning-bg)", color: "var(--color-warning)", padding: "2px 8px", borderRadius: "4px", fontSize: "12px", border: "1px solid rgba(133, 79, 11, 0.15)" }}>
                    COD Unavailable
                  </span>
                )}
              </div>

              {/* Recipient Details */}
              <div>
                <h3 className="text-lg font-semibold text-primary">
                  {address.fullName}
                </h3>
                <p className="text-sm text-secondary mt-2">
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
              <div className="address-card-footer" style={{ display: "flex", gap: "10px", marginTop: "10px", flexWrap: "wrap" }}>
                <Link
                  href={`/account/addresses/${address.id}/edit`}
                  className="btn btn-secondary btn-sm"
                  style={{ minHeight: "36px", padding: "6px 16px", fontSize: "13px" }}
                >
                  Edit
                </Link>
                <Button
                  variant="danger"
                  onClick={() => setConfirmDeleteId(address.id)}
                  disabled={deletingId === address.id || settingDefaultId === address.id}
                  className="btn-sm"
                  style={{ minHeight: "36px", padding: "6px 16px", fontSize: "13px" }}
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
                    style={{ minHeight: "36px", padding: "6px 16px", fontSize: "13px" }}
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
