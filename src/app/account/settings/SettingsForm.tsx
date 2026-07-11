"use client";

import React, { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

interface SettingsFormProps {
  email: string;
  initialPreferences: {
    orderUpdates?: boolean;
    promoEmails?: boolean;
  };
}

export default function SettingsForm({ email, initialPreferences }: SettingsFormProps) {
  const supabase = createSupabaseBrowserClient();

  // Section 1: Change Password State
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  // Section 2: Preferences State
  const [orderUpdates, setOrderUpdates] = useState(!!initialPreferences.orderUpdates);
  const [promoEmails, setPromoEmails] = useState(!!initialPreferences.promoEmails);
  const [prefSaving, setPrefSaving] = useState(false);
  const [prefMessage, setPrefMessage] = useState<string | null>(null);
  const [prefError, setPrefError] = useState<string | null>(null);

  // Section 3: Deletion State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Trigger Supabase password reset email flow
  async function handlePasswordReset() {
    setResetLoading(true);
    setResetError(null);
    setResetSent(false);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/login?next=/account/settings`,
      });

      if (error) {
        setResetError(error.message);
      } else {
        setResetSent(true);
      }
    } catch {
      setResetError("Failed to send password reset email. Please try again.");
    } finally {
      setResetLoading(false);
    }
  }

  // Save notification preferences via API
  async function handleSavePreferences() {
    setPrefSaving(true);
    setPrefError(null);
    setPrefMessage(null);

    try {
      const res = await fetch("/api/v1/account/settings/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderUpdates, promoEmails }),
      });

      const data = await res.json();

      if (!res.ok) {
        setPrefError(data.error || "Failed to save preferences.");
      } else {
        setPrefMessage("Notification preferences saved successfully.");
        setTimeout(() => setPrefMessage(null), 3000);
      }
    } catch {
      setPrefError("Failed to save preferences due to a network error.");
    } finally {
      setPrefSaving(false);
    }
  }

  // Create deletion request support ticket
  async function handleRequestDeletion() {
    setDeleteLoading(true);
    setDeleteError(null);

    try {
      const res = await fetch("/api/v1/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: "Account Deletion Request",
          description: `User (${email}) has requested account deletion. Please review and delete the account within 7 days.`,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setDeleteError(data.error || "Failed to submit deletion request.");
      } else {
        setDeleteSuccess(true);
        setTimeout(() => {
          setShowDeleteModal(false);
          setDeleteSuccess(false);
        }, 3000);
      }
    } catch {
      setDeleteError("Failed to submit request due to a network error.");
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-6 max-w-xl">
      {/* Section 1: Change Password */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-primary mb-4" style={{ fontFamily: "var(--font-heading)" }}>
          Security & Password
        </h2>
        <p className="text-sm text-secondary mb-16">
          Request a password reset link to be sent to your registered email address.
        </p>

        {resetSent && (
          <div className="alert-banner alert-success mb-16">
            <span>✓</span>
            <div>Password reset email sent to <strong>{email}</strong>. Please check your inbox.</div>
          </div>
        )}

        {resetError && (
          <div className="alert-banner alert-danger mb-16">
            <span>⚠</span>
            <div>{resetError}</div>
          </div>
        )}

        <Button
          onClick={handlePasswordReset}
          disabled={resetLoading}
          variant="primary"
          style={{ minWidth: "200px" }}
        >
          {resetLoading ? "Sending Email..." : "Send Password Reset Email"}
        </Button>
      </Card>

      {/* Section 2: Notification Preferences */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-primary mb-4" style={{ fontFamily: "var(--font-heading)" }}>
          Notification Preferences
        </h2>
        <p className="text-sm text-secondary mb-20">
          Choose how you would like to receive updates from GVSwift.
        </p>

        {prefMessage && (
          <div className="alert-banner alert-success mb-16">
            <span>✓</span>
            <div>{prefMessage}</div>
          </div>
        )}

        {prefError && (
          <div className="alert-banner alert-danger mb-16">
            <span>⚠</span>
            <div>{prefError}</div>
          </div>
        )}

        <div className="flex flex-col gap-4 mb-20">
          <label className="flex items-start gap-3 cursor-pointer" style={{ userSelect: "none" }}>
            <input
              type="checkbox"
              checked={orderUpdates}
              onChange={(e) => {
                setOrderUpdates(e.target.checked);
                setPrefMessage(null);
              }}
              style={{
                width: "20px",
                height: "20px",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--color-border)",
                accentColor: "var(--color-primary)",
                marginTop: "2px",
              }}
            />
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-primary">Order Status Updates</span>
              <span className="text-xs text-secondary">Receive real-time email notifications when your order status changes.</span>
            </div>
          </label>

          <label className="flex items-start gap-3 cursor-pointer" style={{ userSelect: "none" }}>
            <input
              type="checkbox"
              checked={promoEmails}
              onChange={(e) => {
                setPromoEmails(e.target.checked);
                setPrefMessage(null);
              }}
              style={{
                width: "20px",
                height: "20px",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--color-border)",
                accentColor: "var(--color-primary)",
                marginTop: "2px",
              }}
            />
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-primary">Promotional Emails</span>
              <span className="text-xs text-secondary">Get early access to collections, new products, and exclusive offers.</span>
            </div>
          </label>
        </div>

        <Button
          onClick={handleSavePreferences}
          disabled={prefSaving}
          variant="primary"
          style={{ minWidth: "160px" }}
        >
          {prefSaving ? "Saving..." : "Save Preferences"}
        </Button>
      </Card>

      {/* Section 3: Danger Zone */}
      <Card className="p-6" style={{ borderColor: "var(--color-error)", backgroundColor: "var(--color-error-bg)" }}>
        <h2 className="text-lg font-semibold text-error mb-4" style={{ fontFamily: "var(--font-heading)", color: "var(--color-error)" }}>
          Danger Zone
        </h2>
        <p className="text-sm text-secondary mb-16">
          Request to permanently close and delete your account. This action is irreversible.
        </p>

        <button
          onClick={() => setShowDeleteModal(true)}
          style={{
            backgroundColor: "var(--color-error)",
            color: "#fff",
            border: "none",
            borderRadius: "var(--radius-md)",
            padding: "8px 16px",
            fontSize: "14px",
            fontWeight: 500,
            cursor: "pointer",
            transition: "background-color 0.2s",
          }}
          onMouseOver={(e) => (e.currentTarget.style.opacity = "0.85")}
          onMouseOut={(e) => (e.currentTarget.style.opacity = "1")}
        >
          Request Account Deletion
        </button>
      </Card>

      {/* Account Deletion Confirmation Modal */}
      {showDeleteModal && (
        <div
          className="modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget && !deleteLoading) {
              setShowDeleteModal(false);
              setDeleteError(null);
            }
          }}
        >
          <div className="modal-container" role="dialog" aria-modal="true" aria-labelledby="delete-modal-title">
            <div className="modal-header">
              <h3 id="delete-modal-title" className="modal-title text-error" style={{ color: "var(--color-error)" }}>
                Request Account Deletion
              </h3>
              <button
                className="modal-close-btn"
                onClick={() => {
                  if (!deleteLoading) {
                    setShowDeleteModal(false);
                    setDeleteError(null);
                  }
                }}
                aria-label="Close"
                disabled={deleteLoading}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
            </div>

            <div className="modal-body">
              {deleteSuccess ? (
                <div className="alert-banner alert-success mb-0">
                  <span>✓</span>
                  <div>
                    <strong>Deletion Request Submitted.</strong>
                    <p className="mt-4 text-13">Our team will review it within 7 days.</p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="alert-banner alert-warning mb-16">
                    <span>⚠</span>
                    <div>
                      <strong>Are you sure?</strong>
                      <p className="mt-4 text-13">
                        This will submit a deletion request to our team. Your account will be reviewed and deleted within 7 days.
                      </p>
                    </div>
                  </div>

                  {deleteError && (
                    <div className="alert-banner alert-danger mt-12 mb-0">
                      <span>⚠</span>
                      <div>{deleteError}</div>
                    </div>
                  )}
                </>
              )}
            </div>

            {!deleteSuccess && (
              <div className="modal-footer">
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeleteError(null);
                  }}
                  disabled={deleteLoading}
                >
                  Cancel
                </button>
                <button
                  style={{
                    backgroundColor: "var(--color-error)",
                    color: "#fff",
                    border: "none",
                    borderRadius: "var(--radius-md)",
                    padding: "8px 16px",
                    fontSize: "14px",
                    fontWeight: 500,
                    cursor: "pointer",
                  }}
                  onClick={handleRequestDeletion}
                  disabled={deleteLoading}
                >
                  {deleteLoading ? "Submitting Request..." : "Confirm Deletion Request"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
