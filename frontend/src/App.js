// src/App.js

import React, { useState, useEffect } from "react";
import { Routes, Route, useNavigate, useParams } from "react-router-dom";
import SessionList from "./components/SessionList";
import ChatWindow from "./components/ChatWindow";
import LoginPage from "./components/LoginPage";
import AdminDashboard from "./components/AdminDashboard";
import ToastContainer from "./components/Toast";
import { isLoggedIn, clearUser, getUserEmail } from "./utils/userManager";
import { lightTheme, darkTheme, spacing, typography } from "./theme";

function ChatPage({ theme, onTitleUpdate }) {
    const { id } = useParams();
    if (!id) {
        return (
            <div style={{ padding: "16px", color: theme.text.secondary }}>
                <h2>Select a chat session</h2>
                <p>Create a new chat or choose one on the left.</p>
            </div>
        );
    }
    return <ChatWindow sessionId={id} theme={theme} onTitleUpdate={onTitleUpdate} />;
}

function AppLayout({ themeState }) {
    const navigate = useNavigate();
    const [theme, setTheme] = themeState;
    const isDarkMode = theme === darkTheme;
    const [sessionListKey, setSessionListKey] = useState(0);
    const [chatWindowKey, setChatWindowKey] = useState(0);

    function handleSessionSelected(id) {
        navigate(`/session/${id}`);
    }

    function handleLogout() {
        if (window.confirm("Are you sure you want to logout?")) {
            clearUser();
            navigate("/");
            window.location.reload();
        }
    }

    function handleAdmin() {
        navigate("/admin");
    }

    const toggleTheme = () => {
        setTheme(isDarkMode ? lightTheme : darkTheme);
    };

    // Handle title updates from either SessionList or ChatWindow
    function handleTitleUpdate(sessionId, newTitle) {
        // Force both components to refresh
        setSessionListKey(prev => prev + 1);
        setChatWindowKey(prev => prev + 1);
    }

    const userEmail = getUserEmail();

    return (
        <div
            style={{
                display: "flex",
                height: "100vh",
                fontFamily:
                    "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                backgroundColor: theme.bg.primary,
                color: theme.text.primary,
                transition: "background-color 0.3s ease, color 0.3s ease"
            }}
        >
            <div
                style={{
                    width: "300px",
                    borderRight: `1px solid ${theme.border}`,
                    overflowY: "auto",
                    display: "flex",
                    flexDirection: "column",
                    backgroundColor: theme.bg.secondary,
                    boxShadow: `2px 0 8px ${theme.shadow}`
                }}
            >
                <SessionList 
                    key={sessionListKey}
                    onSessionSelected={handleSessionSelected} 
                    theme={theme}
                    onTitleUpdate={handleTitleUpdate}
                />
                <div
                    style={{
                        padding: spacing.lg,
                        borderTop: `1px solid ${theme.border}`,
                        marginTop: "auto",
                        backgroundColor: theme.bg.secondary
                    }}
                >
                    {userEmail && (
                        <div
                            style={{
                                marginBottom: spacing.md,
                                padding: spacing.md,
                                backgroundColor: theme.bg.primary,
                                borderRadius: "8px",
                                fontSize: typography.fontSize.sm,
                                color: theme.text.secondary,
                                wordBreak: "break-all",
                                border: `1px solid ${theme.border}`
                            }}
                        >
                            👤 {userEmail}
                        </div>
                    )}
                    <div style={{ display: "flex", gap: spacing.sm }}>
                        <button
                            onClick={handleAdmin}
                            style={{
                                flex: 1,
                                padding: `${spacing.sm} ${spacing.md}`,
                                backgroundColor: theme.bg.primary,
                                color: theme.text.primary,
                                border: `1px solid ${theme.border}`,
                                borderRadius: "8px",
                                cursor: "pointer",
                                fontSize: typography.fontSize.base,
                                fontWeight: typography.fontWeight.medium,
                                transition: "all 0.2s ease"
                            }}
                            title="Admin Dashboard"
                        >
                            ⚙️
                        </button>
                        <button
                            onClick={toggleTheme}
                            style={{
                                flex: 1,
                                padding: `${spacing.sm} ${spacing.md}`,
                                backgroundColor: theme.bg.primary,
                                color: theme.text.primary,
                                border: `1px solid ${theme.border}`,
                                borderRadius: "8px",
                                cursor: "pointer",
                                fontSize: typography.fontSize.base,
                                fontWeight: typography.fontWeight.medium,
                                transition: "all 0.2s ease"
                            }}
                            title="Toggle theme"
                        >
                            {isDarkMode ? "☀️" : "🌙"}
                        </button>
                        <button
                            onClick={handleLogout}
                            style={{
                                flex: 1,
                                padding: `${spacing.sm} ${spacing.md}`,
                                backgroundColor: theme.error,
                                color: "#fff",
                                border: "none",
                                borderRadius: "8px",
                                cursor: "pointer",
                                fontSize: typography.fontSize.base,
                                fontWeight: typography.fontWeight.medium,
                                transition: "all 0.2s ease"
                            }}
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </div>

            <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                <Routes>
                    <Route
                        path="/"
                        element={<ChatPage theme={theme} onTitleUpdate={handleTitleUpdate} />}
                    />
                    <Route
                        path="/session/:id"
                        element={<ChatPage key={chatWindowKey} theme={theme} onTitleUpdate={handleTitleUpdate} />}
                    />
                    <Route path="/admin" element={<AdminDashboard theme={theme} />} />
                </Routes>
            </div>
        </div>
    );
}

function App() {
    const [loggedIn, setLoggedIn] = useState(isLoggedIn());
    const [theme, setTheme] = useState(lightTheme);

    useEffect(() => {
        const handleStorageChange = () => {
            setLoggedIn(isLoggedIn());
        };
        window.addEventListener("storage", handleStorageChange);
        return () => window.removeEventListener("storage", handleStorageChange);
    }, []);

    if (!loggedIn) {
        return (
            <>
                <LoginPage onLoginSuccess={() => setLoggedIn(true)} theme={theme} />
                <ToastContainer theme={theme} />
            </>
        );
    }

    return (
        <>
            <AppLayout themeState={[theme, setTheme]} />
            <ToastContainer theme={theme} />
        </>
    );
}

export default App;


