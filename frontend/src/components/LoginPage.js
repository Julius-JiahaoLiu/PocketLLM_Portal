// src/components/LoginPage.js

import React, { useState } from "react";
import { register, login } from "../api/auth";
import { setToken, setUserId, setUserEmail } from "../utils/userManager";
import { toastManager, spacing, typography } from "../theme";

function LoginPage({ onLoginSuccess, theme }) {
    const [mode, setMode] = useState("login"); // "login" | "register"
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [passwordConfirm, setPasswordConfirm] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            if (mode === "register") {
                // Register mode
                if (password !== passwordConfirm) {
                    setError("Passwords do not match");
                    setLoading(false);
                    return;
                }
                if (password.length < 6) {
                    setError("Password must be at least 6 characters");
                    setLoading(false);
                    return;
                }

                const res = await register(email, password);
                setToken(res.token);
                setUserId(res.user_id);
                setUserEmail(res.email);
                toastManager.notify("Registration successful", "success");
                onLoginSuccess();
            } else {
                // Login mode
                const res = await login(email, password);
                setToken(res.token);
                setUserId(res.user_id);
                setUserEmail(res.email);
                toastManager.notify("Login successful", "success");
                onLoginSuccess();
            }
        } catch (err) {
            setError(err.message || "Authentication failed");
            toastManager.notify(err.message || "Authentication failed", "error");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div
            style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "100vh",
                backgroundColor: theme.bg.tertiary
            }}
        >
            <div
                style={{
                    width: "400px",
                    padding: spacing.xxl,
                    backgroundColor: theme.bg.primary,
                    borderRadius: "16px",
                    boxShadow: `0 8px 32px ${theme.shadowLg}`,
                    border: `1px solid ${theme.border}`,
                    animation: "fadeIn 0.3s ease"
                }}
            >
                <div style={{ textAlign: "center", marginBottom: spacing.xl }}>
                    <div style={{ fontSize: "48px", marginBottom: spacing.md }}>💬</div>
                    <h1 style={{ 
                        fontSize: typography.fontSize.xxl, 
                        fontWeight: typography.fontWeight.bold,
                        marginBottom: spacing.xs,
                        color: theme.text.primary
                    }}>
                        PocketLLM
                    </h1>
                    <p style={{ 
                        fontSize: typography.fontSize.base,
                        color: theme.text.secondary,
                        margin: 0
                    }}>
                        {mode === "login" ? "Welcome back" : "Create your account"}
                    </p>
                </div>

                {error && (
                    <div
                        style={{
                            marginBottom: spacing.lg,
                            padding: spacing.md,
                            backgroundColor: theme.error + "20",
                            color: theme.error,
                            borderRadius: "8px",
                            fontSize: typography.fontSize.sm,
                            border: `1px solid ${theme.error}`
                        }}
                    >
                        ⚠️ {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: spacing.lg }}>
                        <label style={{ 
                            display: "block", 
                            marginBottom: spacing.sm, 
                            fontSize: typography.fontSize.base,
                            fontWeight: typography.fontWeight.medium,
                            color: theme.text.primary
                        }}>
                            Email
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            placeholder="your@email.com"
                            required
                            disabled={loading}
                            style={{
                                width: "100%",
                                padding: spacing.md,
                                border: `2px solid ${theme.border}`,
                                borderRadius: "8px",
                                fontSize: typography.fontSize.base,
                                backgroundColor: theme.bg.secondary,
                                color: theme.text.primary,
                                outline: "none",
                                transition: "border-color 0.2s ease"
                            }}
                            onFocus={e => e.target.style.borderColor = theme.primary}
                            onBlur={e => e.target.style.borderColor = theme.border}
                        />
                    </div>

                    <div style={{ marginBottom: spacing.lg }}>
                        <label style={{ 
                            display: "block", 
                            marginBottom: spacing.sm, 
                            fontSize: typography.fontSize.base,
                            fontWeight: typography.fontWeight.medium,
                            color: theme.text.primary
                        }}>
                            Password
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            placeholder="••••••"
                            required
                            disabled={loading}
                            style={{
                                width: "100%",
                                padding: spacing.md,
                                border: `2px solid ${theme.border}`,
                                borderRadius: "8px",
                                fontSize: typography.fontSize.base,
                                backgroundColor: theme.bg.secondary,
                                color: theme.text.primary,
                                outline: "none",
                                transition: "border-color 0.2s ease"
                            }}
                            onFocus={e => e.target.style.borderColor = theme.primary}
                            onBlur={e => e.target.style.borderColor = theme.border}
                        />
                    </div>

                    {mode === "register" && (
                        <div style={{ marginBottom: spacing.lg }}>
                            <label style={{ 
                                display: "block", 
                                marginBottom: spacing.sm, 
                                fontSize: typography.fontSize.base,
                                fontWeight: typography.fontWeight.medium,
                                color: theme.text.primary
                            }}>
                                Confirm Password
                            </label>
                            <input
                                type="password"
                                value={passwordConfirm}
                                onChange={e => setPasswordConfirm(e.target.value)}
                                placeholder="••••••"
                                required
                                disabled={loading}
                                style={{
                                    width: "100%",
                                    padding: spacing.md,
                                    border: `2px solid ${theme.border}`,
                                    borderRadius: "8px",
                                    fontSize: typography.fontSize.base,
                                    backgroundColor: theme.bg.secondary,
                                    color: theme.text.primary,
                                    outline: "none",
                                    transition: "border-color 0.2s ease"
                                }}
                                onFocus={e => e.target.style.borderColor = theme.primary}
                                onBlur={e => e.target.style.borderColor = theme.border}
                            />
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            width: "100%",
                            padding: spacing.md,
                            backgroundColor: loading ? theme.bg.hover : theme.primary,
                            color: "#fff",
                            border: "none",
                            borderRadius: "8px",
                            fontSize: typography.fontSize.base,
                            fontWeight: typography.fontWeight.semibold,
                            cursor: loading ? "not-allowed" : "pointer",
                            marginBottom: spacing.lg,
                            transition: "all 0.2s ease",
                            boxShadow: loading ? "none" : `0 4px 12px ${theme.shadowMd}`
                        }}
                    >
                        {loading ? (mode === "login" ? "Logging in..." : "Registering...") : (mode === "login" ? "Login" : "Register")}
                    </button>
                </form>

                <div style={{ textAlign: "center", paddingTop: spacing.md, borderTop: `1px solid ${theme.border}` }}>
                    <button
                        type="button"
                        onClick={() => {
                            setMode(mode === "login" ? "register" : "login");
                            setError("");
                            setPassword("");
                            setPasswordConfirm("");
                        }}
                        disabled={loading}
                        style={{
                            backgroundColor: "transparent",
                            color: theme.primary,
                            border: "none",
                            cursor: loading ? "not-allowed" : "pointer",
                            fontSize: typography.fontSize.base,
                            fontWeight: typography.fontWeight.medium
                        }}
                    >
                        {mode === "login" ? "Need an account? Register" : "Already have an account? Login"}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default LoginPage;
