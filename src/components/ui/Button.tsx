import React from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger";
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "primary", loading = false, disabled, children, ...props }, ref) => {
    const variantClass = `btn-${variant}`;
    const loadingClass = loading ? "btn-loading" : "";
    const classes = `btn ${variantClass} ${loadingClass} ${className}`.trim();

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
