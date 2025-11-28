// src/components/LoginPage.js

import React, { useState } from "react";
import { register, login } from "../api/auth";
import { setToken, setUserId, setUserEmail } from "../utils/userManager";

function LoginPage({ onLoginSuccess }) {
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
                // 注册模式
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
                onLoginSuccess();
            } else {
                // 登录模式
                const res = await login(email, password);
                setToken(res.token);
                setUserId(res.user_id);
                setUserEmail(res.email);
                onLoginSuccess();
            }
        } catch (err) {
            setError(err.message || "Authentication failed");
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
                backgroundColor: "#fafafa"
            }}
        >
            <div
                style={{
                    width: "350px",
                    padding: "32px",
                    backgroundColor: "#fff",
                    borderRadius: "8px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
                }}
            >
                <h1 style={{ fontSize: "24px", marginBottom: "24px", textAlign: "center" }}>
                    {mode === "login" ? "Login" : "Register"}
                </h1>

                {error && (
                    <div
                        style={{
                            marginBottom: "16px",
                            padding: "8px 12px",
                            backgroundColor: "#ffebee",
                            color: "#c62828",
                            borderRadius: "4px",
                            fontSize: "14px"
                        }}
                    >
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: "16px" }}>
                        <label style={{ display: "block", marginBottom: "6px", fontSize: "14px" }}>
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
                                padding: "8px 12px",
                                border: "1px solid #ccc",
                                borderRadius: "4px",
                                fontSize: "14px",
                                boxSizing: "border-box"
                            }}
                        />
                    </div>

                    <div style={{ marginBottom: "16px" }}>
                        <label style={{ display: "block", marginBottom: "6px", fontSize: "14px" }}>
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
                                padding: "8px 12px",
                                border: "1px solid #ccc",
                                borderRadius: "4px",
                                fontSize: "14px",
                                boxSizing: "border-box"
                            }}
                        />
                    </div>

                    {mode === "register" && (
                        <div style={{ marginBottom: "16px" }}>
                            <label style={{ display: "block", marginBottom: "6px", fontSize: "14px" }}>
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
                                    padding: "8px 12px",
                                    border: "1px solid #ccc",
                                    borderRadius: "4px",
                                    fontSize: "14px",
                                    boxSizing: "border-box"
                                }}
                            />
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            width: "100%",
                            padding: "10px",
                            backgroundColor: "#1976d2",
                            color: "#fff",
                            border: "none",
                            borderRadius: "4px",
                            fontSize: "14px",
                            cursor: loading ? "default" : "pointer",
                            marginBottom: "12px"
                        }}
                    >
                        {loading ? (mode === "login" ? "Logging in..." : "Registering...") : (mode === "login" ? "Login" : "Register")}
                    </button>
                </form>

                <div style={{ textAlign: "center" }}>
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
                            color: "#1976d2",
                            border: "none",
                            cursor: loading ? "default" : "pointer",
                            fontSize: "14px"
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
