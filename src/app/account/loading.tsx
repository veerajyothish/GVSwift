import React from "react";

export default function AccountLoading() {
  return (
    <div className="flex flex-col gap-5">
      <header className="mb-24">
        <div className="skeleton skeleton-title" style={{ height: "36px", width: "250px" }} />
        <div className="skeleton skeleton-subtitle" style={{ height: "16px", width: "350px", marginTop: "8px" }} />
      </header>

      <div className="card p-6 flex flex-col gap-4 max-w-xl">
        <div className="border-b border-color-border pb-3 mb-2" style={{ borderBottom: "1px solid var(--color-border)", paddingBottom: "12px", marginBottom: "8px" }}>
          <div className="skeleton" style={{ height: "24px", width: "150px" }} />
          <div className="skeleton mt-2" style={{ height: "12px", width: "200px" }} />
        </div>

        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex justify-between items-center py-2" style={{ borderBottom: i < 3 ? "1px solid var(--color-border)" : "none", padding: "12px 0" }}>
              <div className="skeleton" style={{ height: "16px", width: "100px" }} />
              <div className="skeleton" style={{ height: "16px", width: "180px" }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
