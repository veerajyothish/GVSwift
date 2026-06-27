import React from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  loading?: boolean;
}

/**
 * Button — maps to globals.css .btn .btn-{variant} classes.
 * Primary/secondary both use pill border-radius (--radius-pill) per PDF spec.
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className = "", variant = "primary", loading = false, disabled, children, ...props },
    ref
  ) => {
    const variantClass = `btn-${variant}`;
    const loadingClass = loading ? "btn-loading" : "";
    const classes = ["btn", variantClass, loadingClass, className]
      .filter(Boolean)
      .join(" ");

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={classes}
        aria-busy={loading}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";