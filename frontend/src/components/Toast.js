// src/components/Toast.js - Toast notification system

import React, { useState, useEffect } from "react";
import { toastManager, lightTheme } from "../theme";

function ToastItem({ toast, onRemove, theme }) {
  useEffect(() => {
    // Auto-remove handled by manager, but we can add a progress bar
    const timer = setTimeout(() => onRemove(toast.id), 3000);
    return () => clearTimeout(timer);
  }, [toast.id, onRemove]);

  const typeColors = {
    success: { bg: theme.success, icon: "✓" },
    error: { bg: theme.error, icon: "✕" },
    warning: { bg: theme.warning, icon: "⚠" },
    info: { bg: theme.info, icon: "ℹ" }
  };

  const typeConfig = typeColors[toast.type] || typeColors.info;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        padding: "12px 16px",
        marginBottom: "8px",
        backgroundColor: typeConfig.bg,
        color: theme.text.inverted,
        borderRadius: "6px",
        boxShadow: `0 4px 12px rgba(0, 0, 0, 0.15)`,
        animation: "slideIn 0.3s ease",
        minWidth: "300px"
      }}
    >
      <span style={{ fontSize: "18px", fontWeight: "bold" }}>
        {typeConfig.icon}
      </span>
      <span style={{ flex: 1, fontSize: "14px" }}>{toast.message}</span>
      <button
        onClick={() => onRemove(toast.id)}
        style={{
          background: "none",
          border: "none",
          color: "inherit",
          cursor: "pointer",
          fontSize: "16px",
          padding: "0",
          opacity: 0.7,
          "&:hover": { opacity: 1 }
        }}
      >
        ×
      </button>
      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}

function ToastContainer({ theme = lightTheme }) {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const unsubscribe = toastManager.subscribe((toast) => {
      if (toast.remove) {
        setToasts(prev => prev.filter(t => t.id !== toast.id));
      } else {
        setToasts(prev => [...prev, toast]);
      }
    });
    return unsubscribe;
  }, []);

  const handleRemove = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <div
      style={{
        position: "fixed",
        top: "16px",
        right: "16px",
        zIndex: 9999,
        pointerEvents: "auto"
      }}
    >
      {toasts.map(toast => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onRemove={handleRemove}
          theme={theme}
        />
      ))}
    </div>
  );
}

export default ToastContainer;
