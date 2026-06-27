import React from "react";

/**
 * Input / Textarea / Select — all use .input-field which is now pill-shaped
 * (border-radius: var(--radius-pill)) per globals.css and PDF spec p.9/13/23/25.
 * Labels: small-caps uppercase, muted secondary colour.
 */

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  required?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, required, className = "", id, ...props }, ref) => {
    const fallbackId = React.useId();
    const uniqueId = id || fallbackId;
    const groupClasses = ["input-group", error ? "input-error" : "", className]
      .filter(Boolean)
      .join(" ");

    return (
      <div className={groupClasses}>
        {label && (
          <label
            htmlFor={uniqueId}
            className={`input-label${required ? " input-required" : ""}`}
          >
            {label}
          </label>
        )}
        <input
          id={uniqueId}
          ref={ref}
          className="input-field"
          aria-invalid={!!error}
          aria-describedby={error ? `${uniqueId}-error` : undefined}
          required={required}
          {...props}
        />
        {error && (
          <span id={`${uniqueId}-error`} className="input-error-msg" aria-live="polite">
            {error}
          </span>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  required?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, required, className = "", id, ...props }, ref) => {
    const fallbackId = React.useId();
    const uniqueId = id || fallbackId;
    const groupClasses = ["input-group", error ? "input-error" : "", className]
      .filter(Boolean)
      .join(" ");

    return (
      <div className={groupClasses}>
        {label && (
          <label
            htmlFor={uniqueId}
            className={`input-label${required ? " input-required" : ""}`}
          >
            {label}
          </label>
        )}
        <textarea
          id={uniqueId}
          ref={ref}
          className="input-field"
          aria-invalid={!!error}
          aria-describedby={error ? `${uniqueId}-error` : undefined}
          required={required}
          {...props}
        />
        {error && (
          <span id={`${uniqueId}-error`} className="input-error-msg" aria-live="polite">
            {error}
          </span>
        )}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  required?: boolean;
  options?: { value: string; label: string }[];
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, required, className = "", id, options = [], children, ...props }, ref) => {
    const fallbackId = React.useId();
    const uniqueId = id || fallbackId;
    const groupClasses = ["input-group", error ? "input-error" : "", className]
      .filter(Boolean)
      .join(" ");

    return (
      <div className={groupClasses}>
        {label && (
          <label
            htmlFor={uniqueId}
            className={`input-label${required ? " input-required" : ""}`}
          >
            {label}
          </label>
        )}
        <select
          id={uniqueId}
          ref={ref}
          className="input-field"
          aria-invalid={!!error}
          aria-describedby={error ? `${uniqueId}-error` : undefined}
          required={required}
          style={{ borderRadius: "var(--radius-lg)" }} /* select looks odd as full pill */
          {...props}
        >
          {children ||
            options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
        </select>
        {error && (
          <span id={`${uniqueId}-error`} className="input-error-msg" aria-live="polite">
            {error}
          </span>
        )}
      </div>
    );
  }
);
Select.displayName = "Select";