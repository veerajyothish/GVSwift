"use client";

import React from "react";

export function TrackOrderButton({ orderId }: { orderId: string }) {
  return (
    <button
      onClick={() => window.dispatchEvent(new CustomEvent("gvswift-open-order-tracking", { detail: { orderId } }))}
      className="btn btn-secondary"
      style={{ minWidth: "140px", justifyContent: "center" }}
    >
      Track Order
    </button>
  );
}
