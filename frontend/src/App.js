// src/App.js

import React, { useState, useEffect } from "react";
import { Routes, Route, useNavigate, useParams } from "react-router-dom";
import SessionList from "./components/SessionList";
import ChatWindow from "./components/ChatWindow";
import LoginPage from "./components/LoginPage";
import { isLoggedIn, clearUser } from "./utils/userManager";

function ChatPage() {
    const { id } = useParams();
    if (!id) {
        return (
            <div style={{ padding: "16px" }}>
                <h2>Select a chat session</h2>
                <p>Create a new chat or choose one on the left.</p>
            </div>
        );
    }
    return <ChatWindow sessionId={id} />;
}

function AppLayout() {
    const navigate = useNavigate();

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

    return (
        <div
            style={{
                display: "flex",
                height: "100vh",
                fontFamily:
                    "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
            }}
        >
            <div
                style={{
                    width: "280px",
                    borderRight: "1px solid #e0e0e0",
                    overflowY: "auto",
                    display: "flex",
                    flexDirection: "column"
                }}
            >
                <SessionList onSessionSelected={handleSessionSelected} />
                <div
                    style={{
                        padding: "12px 16px",
                        borderTop: "1px solid #e0e0e0",
                        marginTop: "auto"
                    }}
                >
                    <button
                        onClick={handleLogout}
                        style={{
                            width: "100%",
                            padding: "8px 12px",
                            backgroundColor: "#f44336",
                            color: "#fff",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer",
                            fontSize: "14px"
                        }}
                    >
                        Logout
                    </button>
                </div>
            </div>

            <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                <Routes>
                    <Route path="/" element={<ChatPage />} />
                    <Route path="/session/:id" element={<ChatPage />} />
                </Routes>
            </div>
        </div>
    );
}

function App() {
    const [loggedIn, setLoggedIn] = useState(isLoggedIn());

    useEffect(() => {
        // 检查登录状态（可选，用于跨标签页同步）
        const handleStorageChange = () => {
            setLoggedIn(isLoggedIn());
        };
        window.addEventListener("storage", handleStorageChange);
        return () => window.removeEventListener("storage", handleStorageChange);
    }, []);

    if (!loggedIn) {
        return <LoginPage onLoginSuccess={() => setLoggedIn(true)} />;
    }

    return <AppLayout />;
}

export default App;


