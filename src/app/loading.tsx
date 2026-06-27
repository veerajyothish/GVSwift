import React from "react";
import Image from "next/image";

export default function Loading() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        width: "100%",
        backgroundColor: "#fcf9f8",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Styles for custom pulse and progress animations */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes pulse-slow {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(0.98); }
        }
        @keyframes progress-loading {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(-20%); }
          100% { transform: translateX(100%); }
        }
        .animate-pulse-slow {
          animation: pulse-slow 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        .animate-progress {
          animation: progress-loading 2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
      `}} />

      {/* Subtle background radial gradient */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: "radial-gradient(circle at center, rgba(86, 25, 34, 0.03) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      {/* Central Content */}
      <div
        style={{
          zIndex: 10,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "48px",
          maxWidth: "400px",
          padding: "0 20px",
        }}
      >
        {/* Logo */}
        <div className="animate-pulse-slow">
          <Image
            src="/logo.png"
            alt="GVSwift"
            width={200}
            height={46}
            style={{ height: "46px", width: "auto", objectFit: "contain" }}
            priority
          />
        </div>

        {/* Loading Indicator */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "24px",
            width: "100%",
          }}
        >
          {/* Progress Bar Container */}
          <div
            style={{
              height: "2px",
              width: "180px",
              backgroundColor: "rgba(86, 25, 34, 0.1)",
              borderRadius: "9999px",
              overflow: "hidden",
              position: "relative",
            }}
          >
            {/* Animated Inner Bar */}
            <div
              className="animate-progress"
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                height: "100%",
                width: "100%",
                backgroundColor: "var(--color-primary, #561922)",
                borderRadius: "9999px",
                transformOrigin: "left",
              }}
            />
          </div>

          {/* Loading Subtext */}
          <p
            style={{
              fontFamily: "var(--font-heading, 'EB Garamond', serif)",
              fontSize: "18px",
              color: "var(--color-text-secondary, #605e5b)",
              fontStyle: "italic",
              opacity: 0.8,
              margin: 0,
            }}
          >
            Crafting your experience...
          </p>
        </div>
      </div>
    </div>
  );
}
