"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";

type ToastType = "success" | "error" | "info" | "warning";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} });

export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, type: ToastType = "info") => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  const icons: Record<ToastType, string> = {
    success: "✅",
    error: "❌",
    info: "ℹ️",
    warning: "⚠️",
  };

  const colors: Record<ToastType, string> = {
    success: "#10b981",
    error: "#ef4444",
    info: "#6366f1",
    warning: "#f59e0b",
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      <div
        style={{
          position: "fixed",
          bottom: "24px",
          right: "24px",
          zIndex: 9999,
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          maxWidth: "380px",
        }}
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "14px 18px",
              background: "var(--bg-card)",
              borderRadius: "12px",
              boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
              border: `1px solid var(--border)`,
              borderLeft: `4px solid ${colors[t.type]}`,
              animation: "fadeIn 0.3s ease",
              minWidth: "280px",
            }}
          >
            <span style={{ fontSize: "18px" }}>{icons[t.type]}</span>
            <span style={{ color: "var(--text-primary)", fontSize: "14px", fontWeight: 500 }}>
              {t.message}
            </span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}

export default ToastContext;
