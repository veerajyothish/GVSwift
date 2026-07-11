"use client";

import { useEffect } from "react";

/**
 * Provides global tactile feedback for the application.
 * 1. Enables iOS Safari `:active` pseudo-classes by attaching a touchstart listener.
 * 2. Fires a brief hardware haptic vibration when any interactive element is clicked.
 */
export function GlobalClickInteraction() {
  useEffect(() => {
    // Empty touchstart listener allows CSS :active to work on iOS
    const handleTouchStart = () => {};
    document.addEventListener("touchstart", handleTouchStart, { passive: true });

    // Global click listener to add haptic vibration
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Check if the clicked element or its parent is an interactive element
      const clickable = target.closest("button, a, [role='button'], .btn, .card");
      
      if (clickable) {
        // Trigger a subtle 15ms vibration if the browser/device supports it
        if (typeof navigator !== "undefined" && navigator.vibrate) {
          try {
            navigator.vibrate(15);
          } catch (err) {
            // Silently ignore if blocked or unsupported
          }
        }
      }
    };

    document.addEventListener("click", handleClick, { passive: true, capture: true });

    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("click", handleClick, { capture: true });
    };
  }, []);

  return null;
}
