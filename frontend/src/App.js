// src/App.js

import React from "react";
import { Routes, Route, useNavigate, useParams } from "react-router-dom";
import SessionList from "./components/SessionList";
import ChatWindow from "./components/ChatWindow";

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
                    overflowY: "auto"
                }}
            >
                <SessionList onSessionSelected={handleSessionSelected} />
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
    return <AppLayout />;
}

export default App;


