"use client";

import React, { createContext, useContext, useState, useCallback } from "react";

export type ToastType = "success" | "error" | "info";

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message: string;
  duration?: number;
}

interface ToastContextType {
  toast: {
    success: (message: string, title?: string, duration?: number) => void;
    error: (message: string, title?: string, duration?: number) => void;
    info: (message: string, title?: string, duration?: number) => void;
  };
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((type: ToastType, message: string, title?: string, duration = 4000) => {
    const id = Math.random().toString(36).substring(2, 9);
    const defaultTitle = type.charAt(0).toUpperCase() + type.slice(1);
    
    setToasts((prev) => [...prev, { id, type, message, title: title || defaultTitle, duration }]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  const toast = React.useMemo(() => ({
    success: (message: string, title?: string, duration?: number) => addToast("success", message, title, duration),
    error: (message: string, title?: string, duration?: number) => addToast("error", message, title, duration),
    info: (message: string, title?: string, duration?: number) => addToast("info", message, title, duration),
  }), [addToast]);

  return (
    <ToastContext.Provider value={{ toast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
};

interface ToastContainerProps {
  toasts: ToastItem[];
  removeToast: (id: string) => void;
}

const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, removeToast }) => {
  return (
    <div className="toast-container" aria-live="assertive" aria-atomic="true">
      {toasts.map((item) => (
        <Toast key={item.id} item={item} onClose={() => removeToast(item.id)} />
      ))}
    </div>
  );
};

const Toast: React.FC<{ item: ToastItem; onClose: () => void }> = ({ item, onClose }) => {
  const typeClass = `toast-${item.type}`;
  return (
    <div className={`toast ${typeClass}`} role="alert">
      <div className="toast-content">
        <div className="toast-title">{item.title}</div>
        <div className="toast-message">{item.message}</div>
      </div>
      <button className="toast-close-btn" onClick={onClose} aria-label="Close notification">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          style={{ width: "16px", height: "16px" }}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
};
