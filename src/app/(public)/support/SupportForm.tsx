"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

interface OrderOption {
  id: string;
  status: string;
}

interface SupportFormProps {
  orders: OrderOption[];
}

export function SupportForm({ orders }: SupportFormProps) {
  const router = useRouter();
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [orderId, setOrderId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmedSubject = subject.trim();
    const trimmedDescription = description.trim();

    if (!trimmedSubject) {
      setError("Subject is required.");
      return;
    }

    if (trimmedDescription.length > 5000) {
      setError("Description must be under 5000 characters.");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/v1/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: trimmedSubject,
          description: trimmedDescription || undefined,
          orderId: orderId || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create support ticket. Please try again.");
        setLoading(false);
        return;
      }

      setSuccess(true);
      setSubject("");
      setDescription("");
      setOrderId("");
      setLoading(false);

      // Refresh page to show newly created ticket in the list
      router.refresh();

      // Reset success message after 3 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch {
      setError("Network error. Please check your connection and try again.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card" style={{ padding: "24px" }}>
      <h2
        className="text-lg font-semibold"
        style={{ color: "var(--color-text-primary)", marginBottom: "20px" }}
      >
        Submit a Support Ticket
      </h2>

      {error && (
        <div
          className="alert-banner alert-error"
          style={{
            marginBottom: "20px",
            padding: "12px 16px",
            borderRadius: "var(--radius-md)",
            fontSize: "14px",
            backgroundColor: "var(--color-error-bg)",
            color: "var(--color-error)",
            border: "1px solid color-mix(in srgb, var(--color-error) 25%, transparent)",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <span>⚠</span>
          <div>{error}</div>
        </div>
      )}

      {success && (
        <div
          className="alert-banner alert-success"
          style={{
            marginBottom: "20px",
            padding: "12px 16px",
            borderRadius: "var(--radius-md)",
            fontSize: "14px",
            backgroundColor: "var(--color-success-bg)",
            color: "var(--color-success)",
            border: "1px solid color-mix(in srgb, var(--color-success) 25%, transparent)",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <span>✓</span>
          <div>Support ticket created successfully!</div>
        </div>
      )}

      {/* Subject Input */}
      <div className="input-group">
        <label htmlFor="ticket-subject" className="input-label input-required">
          Subject
        </label>
        <input
          id="ticket-subject"
          type="text"
          className="input-field"
          placeholder="Brief summary of the issue..."
          value={subject}
          onChange={(e) => {
            setSubject(e.target.value);
            if (error) setError(null);
          }}
          required
          disabled={loading}
        />
      </div>

      {/* Description Input */}
      <div className="input-group" style={{ marginTop: "16px" }}>
        <label htmlFor="ticket-description" className="input-label">
          Description
        </label>
        <textarea
          id="ticket-description"
          className="input-field"
          placeholder="Please describe the issue in detail..."
          value={description}
          onChange={(e) => {
            setDescription(e.target.value);
            if (error) setError(null);
          }}
          rows={5}
          maxLength={5000}
          disabled={loading}
        />
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "4px" }}>
          <span className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
            {description.length}/5000
          </span>
        </div>
      </div>

      {/* Order Dropdown */}
      <div className="input-group" style={{ marginTop: "8px" }}>
        <label htmlFor="ticket-order" className="input-label">
          Related Order (Optional)
        </label>
        <select
          id="ticket-order"
          className="input-field"
          value={orderId}
          onChange={(e) => setOrderId(e.target.value)}
          disabled={loading}
        >
          <option value="">None (General Inquiry)</option>
          {orders.map((order) => (
            <option key={order.id} value={order.id}>
              Order #{order.id.slice(0, 8)} ({order.status})
            </option>
          ))}
        </select>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        className={`btn btn-primary w-full ${loading ? "btn-loading" : ""}`}
        style={{ marginTop: "24px" }}
        disabled={loading || !subject.trim()}
      >
        Submit Ticket
      </button>
    </form>
  );
}
