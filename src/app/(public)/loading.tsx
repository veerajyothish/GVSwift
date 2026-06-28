import React from "react";
import Image from "next/image";

export default function Loading() {
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "var(--color-bg, #FDFAF5)",
        zIndex: 99999,
      }}
    >
      <style>{`
        .loading-logo-container {
          animation: elegant-pulse 1.8s ease-in-out infinite;
          display: flex;
          align-items: center;
          justifyContent: center;
        }

        .loading-logo {
          height: 60px;
          width: auto;
          object-fit: contain;
        }

        @media (min-width: 768px) {
          .loading-logo {
            height: 120px;
          }
        }

        @keyframes elegant-pulse {
          0% {
            opacity: 0.35;
            transform: scale(0.97);
          }
          50% {
            opacity: 0.85;
            transform: scale(1.01);
          }
          100% {
            opacity: 0.35;
            transform: scale(0.97);
          }
        }
      `}</style>
      <div className="loading-logo-container">
        <Image
          src="/logo.png"
          alt="GVSwift Logo"
          width={526}
          height={120}
          priority
          className="loading-logo"
        />
      </div>
    </div>
  );
}