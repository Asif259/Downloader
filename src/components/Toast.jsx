"use client";

import { useCallback, useEffect, useState } from "react";

const ToastContext = {
  toasts: [],
  listeners: new Set(),
  addToast(toast) {
    this.toasts.push({ ...toast, id: Date.now() + Math.random() });
    this.notify();
  },
  removeToast(id) {
    this.toasts = this.toasts.filter((t) => t.id !== id);
    this.notify();
  },
  notify() {
    this.listeners.forEach((listener) => listener([...this.toasts]));
  },
};

export function toast({ title, message, type = "success" }) {
  ToastContext.addToast({ title, message, type });
}

export function useToasts() {
  const [toasts, setToasts] = useState([...ToastContext.toasts]);

  useEffect(() => {
    ToastContext.listeners.add(setToasts);
    return () => {
      ToastContext.listeners.delete(setToasts);
    };
  }, []);

  const removeToast = useCallback((id) => {
    ToastContext.removeToast(id);
  }, []);

  return [toasts, removeToast];
}

function ToastIcon({ type }) {
  switch (type) {
    case "success":
      return (
        <svg className="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M9 12l2 2 4-4" />
        </svg>
      );
    case "error":
      return (
        <svg className="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M15 9l-6 6M9 9l6 6" />
        </svg>
      );
    case "warning":
      return (
        <svg className="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 9v4M12 17h.01" />
          <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        </svg>
      );
    default:
      return null;
  }
}

function ToastItem({ toast, onRemove }) {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setExiting(true);
      setTimeout(() => onRemove(toast.id), 300);
    }, 5000);

    return () => clearTimeout(timer);
  }, [toast.id, onRemove]);

  const handleClose = () => {
    setExiting(true);
    setTimeout(() => onRemove(toast.id), 300);
  };

  return (
    <div className={`toast ${toast.type} ${exiting ? "exiting" : ""}`}>
      <ToastIcon type={toast.type} />
      <div className="toast-content">
        {toast.title && <div className="toast-title">{toast.title}</div>}
        {toast.message && <div className="toast-message">{toast.message}</div>}
      </div>
      <button className="toast-close" onClick={handleClose} aria-label="Close">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

export default function ToastContainer() {
  const [toasts, removeToast] = useToasts();

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onRemove={removeToast} />
      ))}
    </div>
  );
}
