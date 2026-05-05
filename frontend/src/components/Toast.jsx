import React, { useState, useCallback, createContext, useContext } from "react";

const ToastContext = createContext();

export function useToast() {
    return useContext(ToastContext);
}

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback((message, type = "info", duration = 4000) => {
        const id = Date.now() + Math.random();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, duration);
    }, []);

    const toast = {
        success: (msg) => addToast(msg, "success"),
        error: (msg) => addToast(msg, "error"),
        info: (msg) => addToast(msg, "info"),
        warning: (msg) => addToast(msg, "warning"),
    };

    const icons = { success: "✅", error: "❌", warning: "⚠️", info: "ℹ️" };
    const colors = {
        success: { bg: "rgba(34,197,94,0.15)", border: "rgba(34,197,94,0.3)", text: "#86efac" },
        error: { bg: "rgba(239,68,68,0.15)", border: "rgba(239,68,68,0.3)", text: "#fca5a5" },
        warning: { bg: "rgba(234,179,8,0.15)", border: "rgba(234,179,8,0.3)", text: "#fde68a" },
        info: { bg: "rgba(96,165,250,0.15)", border: "rgba(96,165,250,0.3)", text: "#93c5fd" },
    };

    return (
        <ToastContext.Provider value={toast}>
            {children}
            {/* Toast Container */}
            <div style={{
                position: "fixed", top: "16px", right: "16px", zIndex: 9999,
                display: "flex", flexDirection: "column", gap: "8px", maxWidth: "360px",
            }}>
                {toasts.map(t => {
                    const c = colors[t.type] || colors.info;
                    return (
                        <div key={t.id} style={{
                            background: c.bg, border: `1px solid ${c.border}`,
                            borderRadius: "12px", padding: "12px 16px",
                            display: "flex", alignItems: "center", gap: "10px",
                            backdropFilter: "blur(16px)",
                            animation: "slideInRight 0.3s ease-out",
                            boxShadow: "0 8px 30px rgba(0,0,0,0.3)",
                        }}>
                            <span style={{ fontSize: "18px" }}>{icons[t.type]}</span>
                            <span style={{ color: c.text, fontSize: "13px", fontWeight: 500 }}>{t.message}</span>
                        </div>
                    );
                })}
            </div>
        </ToastContext.Provider>
    );
}
