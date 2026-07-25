import { useEffect, useRef } from "react";

const FOCUSABLE_ELEMENTS_SELECTOR =
  'a[href], button, input, textarea, select, details, [tabindex]:not([tabindex="-1"])';

export function useOverlay(isOpen: boolean, onClose: () => void, panelRef: React.RefObject<HTMLElement | null>) {
  const triggerElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    // 1. Save the element that triggered the overlay
    if (document.activeElement instanceof HTMLElement) {
      triggerElementRef.current = document.activeElement;
    }

    // 2. Set inert on main content
    const mainContent = document.getElementById("main-content");
    if (mainContent) {
      mainContent.setAttribute("inert", "");
    }

    // 3. Prevent body scroll
    document.body.style.overflow = "hidden";

    // 4. Handle popstate (mobile back button)
    // Push a state so the back button doesn't leave the page
    window.history.pushState({ overlayOpen: true }, "");
    const handlePopState = (e: PopStateEvent) => {
      // If the back button was pressed, close the overlay instead of navigating
      e.preventDefault();
      onClose();
    };
    window.addEventListener("popstate", handlePopState);

    // 5. Handle Esc key
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        // Since we pushed state, we should pop it if Esc is pressed
        window.history.back();
        onClose();
      }

      // 6. Focus Trap
      if (e.key === "Tab" && panelRef.current) {
        const focusableElements = Array.from(
          panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_ELEMENTS_SELECTOR)
        ).filter(el => !el.hasAttribute("disabled"));

        if (focusableElements.length === 0) {
          e.preventDefault();
          return;
        }

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          // Shift + Tab
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          // Tab
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    // Initial focus on open
    if (panelRef.current) {
      const focusableElements = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_ELEMENTS_SELECTOR)
      ).filter(el => !el.hasAttribute("disabled"));
      
      // Delay focus slightly to ensure portal is rendered
      requestAnimationFrame(() => {
        if (focusableElements.length > 0) {
          focusableElements[0].focus();
        } else {
          panelRef.current?.focus();
        }
      });
    }

    return () => {
      // Restore everything
      if (mainContent) {
        mainContent.removeAttribute("inert");
      }
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("popstate", handlePopState);
      
      // Clean up the history state if it was left hanging (e.g. closed without back button/Esc)
      // Removed history.back() because it breaks Next.js <Link> navigation
      // when a user clicks a link inside the overlay.

      // Restore focus to trigger
      if (triggerElementRef.current) {
        triggerElementRef.current.focus();
      }
    };
  }, [isOpen, onClose, panelRef]);
}
