// src/components/SessionList.js

import React, { useEffect, useState } from "react";
import { fetchSessions, createSession, deleteSession } from "../api/sessions";
import { useLocation, useNavigate } from "react-router-dom";
import UserInfo from "./UserInfo";

function SessionList({ onSessionSelected }) {
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState(null);
    const location = useLocation();
    const navigate = useNavigate();

    const currentSessionId = (() => {
        const parts = location.pathname.split("/");
        if (parts[1] === "session" && parts[2]) {
            return parts[2];
        }
        return null;
    })();

    async function loadSessions() {
        try {
            setLoading(true);
            setError(null);
            const data = await fetchSessions();
            data.sort(
                (a, b) =>
                    new Date(b.updated_at).getTime() -
                    new Date(a.updated_at).getTime()
            );
            setSessions(data);
        } catch (e) {
            setError(e.message || "Failed to load sessions");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadSessions();
    }, []);

    async function handleCreateSession() {
        try {
            setCreating(true);
            const res = await createSession("New Chat");
            await loadSessions();
            onSessionSelected(res.id);
        } catch (e) {
            alert(e.message || "Failed to create session");
        } finally {
            setCreating(false);
        }
    }

    async function handleDeleteSession(e, id) {
        e.stopPropagation();
        const ok = window.confirm("Delete this session and all its messages?");
        if (!ok) return;
        try {
            await deleteSession(id);
            // If the deleted session is currently active, navigate back to home
            if (id === currentSessionId) {
                navigate("/");
            }
            await loadSessions();
        } catch (e2) {
            alert("Failed to delete session");
        }
    }

    return (
        <div style={{ padding: "12px", display: "flex", flexDirection: "column", height: "100%" }}>
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "12px"
                }}
            >
                <h2 style={{ fontSize: "16px", margin: 0 }}>PocketLLM</h2>
                <button
                    onClick={handleCreateSession}
                    disabled={creating}
                    style={{
                        fontSize: "12px",
                        padding: "4px 8px",
                        cursor: "pointer"
                    }}
                >
                    {creating ? "Creating..." : "New Chat"}
                </button>
            </div>

            {loading && <p>Loading sessions...</p>}
            {error && (
                <p style={{ color: "red", fontSize: "12px" }}>{error}</p>
            )}

            <ul style={{ listStyle: "none", padding: 0, margin: 0, flex: 1, overflowY: "auto" }}>
                {sessions.map(s => (
                    <li
                        key={s.id}
                        onClick={() => onSessionSelected(s.id)}
                        style={{
                            padding: "8px",
                            marginBottom: "4px",
                            borderRadius: "6px",
                            cursor: "pointer",
                            backgroundColor:
                                s.id === currentSessionId
                                    ? "#e3f2fd"
                                    : "transparent",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center"
                        }}
                    >
                        <div>
                            <div
                                style={{
                                    fontSize: "13px",
                                    fontWeight: 500,
                                    marginBottom: "2px"
                                }}
                            >
                                {s.title || "Untitled"}
                            </div>
                        </div>
                        <button
                            onClick={e => handleDeleteSession(e, s.id)}
                            style={{
                                fontSize: "11px",
                                padding: "2px 6px",
                                cursor: "pointer"
                            }}
                        >
                            Delete
                        </button>
                    </li>
                ))}
                {sessions.length === 0 && !loading && (
                    <li style={{ fontSize: "12px", color: "#777" }}>
                        No sessions yet. Click New Chat.
                    </li>
                )}
            </ul>

            <UserInfo />
        </div>
    );
}

export default SessionList;
