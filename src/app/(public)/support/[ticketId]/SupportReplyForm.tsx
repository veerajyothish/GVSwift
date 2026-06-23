"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

interface SupportReplyFormProps {
  ticketId: string;
  isTerminalStatus: boolean;
  statusLabel: string;
}

export function SupportReplyForm({ ticketId, isTerminalStatus, statusLabel }: SupportReplyFormProps) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = message.trim();

    if (!trimmed) {
      setError("Reply message cannot be empty.");
      return;
    }

    if (trimmed.length > 5000) {
      setError("Reply message must be under 5000 characters.");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`/api/v1/support/${ticketId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to send message. Please try again.");
        setLoading(false);
        return;
      }

      setMessage("");
      setLoading(false);

      // Refresh page to show new message in the thread
      router.refresh();
    } catch {
      setError("Network error. Please check your connection and try again.");
      setLoading(false);
    }
  }

  if (isTerminalStatus) {
    return (
      <div className="card bg-default p-4 text-center text-secondary mt-24">
        <div className="mb-8" style={{ fontSize: "20px" }}>🔒</div>
        <p className="text-sm">
          This ticket is marked as <strong>{statusLabel}</strong>. Replies are disabled.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-24">
      <div className="input-group">
        <label htmlFor="reply-message" className="input-label input-required">
          Write a reply
        </label>
        <textarea
          id="reply-message"
          className="input-field"
          placeholder="Type your message here..."
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
            if (error) setError(null);
          }}
          rows={4}
          maxLength={5000}
          disabled={loading}
          required
        />
        <div className="flex justify-between items-center mt-4">
          {error ? (
            <span className="input-error-msg text-13">
              ⚠ {error}
            </span>
          ) : (
            <span />
          )}
          <span className="text-xs text-secondary">
            {message.length}/5000
          </span>
        </div>
      </div>

      <button
        type="submit"
        className={`btn btn-primary mt-12 ${loading ? "btn-loading" : ""}`}
        style={{ minWidth: "120px" }}
        disabled={loading || !message.trim()}
      >
        Send Reply
      </button>
    </form>
  );
}
