// src/components/SessionList.js

import React, { useEffect, useState } from "react";
import { fetchSessions, createSession, deleteSession, updateSession } from "../api/sessions";
import { useLocation, useNavigate } from "react-router-dom";
import { toastManager, spacing, typography } from "../theme";

function SessionList({ onSessionSelected, theme, onTitleUpdate }) {
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState(null);
    const [editingSessionId, setEditingSessionId] = useState(null);
    const [editTitle, setEditTitle] = useState("");
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
            // Sort by created_at (newest first) to maintain order when editing titles
            data.sort(
                (a, b) =>
                    new Date(b.created_at).getTime() -
                    new Date(a.created_at).getTime()
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
            toastManager.notify("Session created", "success");
        } catch (e) {
            toastManager.notify(e.message || "Failed to create session", "error");
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
            if (id === currentSessionId) {
                navigate("/");
            }
            await loadSessions();
            toastManager.notify("Session deleted", "success");
        } catch (e2) {
            toastManager.notify("Failed to delete session", "error");
        }
    }

    function startEditSession(e, session) {
        e.stopPropagation();
        setEditingSessionId(session.id);
        setEditTitle(session.title || "");
    }

    function cancelEdit() {
        setEditingSessionId(null);
        setEditTitle("");
    }

    async function saveEdit(e, sessionId) {
        e.stopPropagation();
        if (!editTitle.trim()) {
            toastManager.notify("Title cannot be empty", "warning");
            return;
        }
        try {
            await updateSession(sessionId, editTitle.trim());
            await loadSessions();
            setEditingSessionId(null);
            setEditTitle("");
            toastManager.notify("Title updated", "success");
            // Notify parent to update ChatWindow
            if (onTitleUpdate) {
                onTitleUpdate(sessionId, editTitle.trim());
            }
        } catch (e) {
            toastManager.notify("Failed to update title", "error");
        }
    }

    return (
        <div style={{ 
            padding: spacing.md, 
            display: "flex", 
            flexDirection: "column", 
            height: "100%",
            backgroundColor: theme.bg.secondary
        }}>
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: spacing.lg,
                    paddingBottom: spacing.md,
                    borderBottom: `2px solid ${theme.border}`
                }}
            >
                <h2 style={{ 
                    fontSize: typography.fontSize.xl, 
                    fontWeight: typography.fontWeight.bold,
                    margin: 0,
                    color: theme.text.primary
                }}>
                    💬 PocketLLM
                </h2>
                <button
                    onClick={handleCreateSession}
                    disabled={creating}
                    style={{
                        fontSize: typography.fontSize.sm,
                        fontWeight: typography.fontWeight.medium,
                        padding: `${spacing.xs} ${spacing.md}`,
                        backgroundColor: theme.primary,
                        color: "#fff",
                        border: "none",
                        borderRadius: "6px",
                        cursor: creating ? "not-allowed" : "pointer",
                        transition: "all 0.2s ease",
                        opacity: creating ? 0.6 : 1
                    }}
                >
                    {creating ? "Creating..." : "+ New"}
                </button>
            </div>

            {loading && (
                <div style={{ padding: spacing.lg, textAlign: "center" }}>
                    <div style={{ 
                        fontSize: typography.fontSize.base,
                        color: theme.text.secondary 
                    }}>
                        Loading...
                    </div>
                </div>
            )}
            {error && (
                <div style={{ 
                    padding: spacing.sm,
                    backgroundColor: theme.error + "20",
                    color: theme.error,
                    borderRadius: "6px",
                    fontSize: typography.fontSize.sm,
                    marginBottom: spacing.md
                }}>
                    {error}
                </div>
            )}

            <ul style={{ 
                listStyle: "none", 
                padding: 0, 
                margin: 0, 
                flex: 1, 
                overflowY: "auto",
                scrollbarWidth: "thin"
            }}>
                {sessions.map(s => (
                    <li
                        key={s.id}
                        onClick={() => editingSessionId !== s.id && onSessionSelected(s.id)}
                        style={{
                            padding: spacing.md,
                            marginBottom: spacing.sm,
                            borderRadius: "8px",
                            cursor: editingSessionId === s.id ? "default" : "pointer",
                            backgroundColor: s.id === currentSessionId
                                ? theme.primaryLight
                                : theme.bg.primary,
                            border: s.id === currentSessionId
                                ? `2px solid ${theme.primary}`
                                : `1px solid ${theme.border}`,
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            transition: "all 0.2s ease",
                            boxShadow: s.id === currentSessionId 
                                ? `0 2px 8px ${theme.shadowMd}`
                                : "none"
                        }}
                        onMouseEnter={e => {
                            if (s.id !== currentSessionId && editingSessionId !== s.id) {
                                e.currentTarget.style.backgroundColor = theme.bg.hover;
                            }
                        }}
                        onMouseLeave={e => {
                            if (s.id !== currentSessionId && editingSessionId !== s.id) {
                                e.currentTarget.style.backgroundColor = theme.bg.primary;
                            }
                        }}
                    >
                        <div style={{ flex: 1, minWidth: 0, marginRight: spacing.sm }}>
                            {editingSessionId === s.id ? (
                                <input
                                    type="text"
                                    value={editTitle}
                                    onChange={e => setEditTitle(e.target.value)}
                                    onKeyDown={e => {
                                        if (e.key === "Enter") saveEdit(e, s.id);
                                        if (e.key === "Escape") cancelEdit();
                                    }}
                                    onClick={e => e.stopPropagation()}
                                    autoFocus
                                    style={{
                                        width: "100%",
                                        padding: spacing.xs,
                                        fontSize: typography.fontSize.base,
                                        fontWeight: typography.fontWeight.medium,
                                        border: `2px solid ${theme.primary}`,
                                        borderRadius: "4px",
                                        backgroundColor: theme.bg.primary,
                                        color: theme.text.primary,
                                        outline: "none"
                                    }}
                                />
                            ) : (
                                <>
                                    <div
                                        style={{
                                            fontSize: typography.fontSize.base,
                                            fontWeight: typography.fontWeight.medium,
                                            marginBottom: spacing.xs,
                                            color: theme.text.primary,
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                            whiteSpace: "nowrap"
                                        }}
                                    >
                                        {s.title || "Untitled"}
                                    </div>
                                    <div
                                        style={{
                                            fontSize: typography.fontSize.xs,
                                            color: theme.text.tertiary
                                        }}
                                    >
                                        {s.created_at ? new Date(s.created_at).toLocaleDateString() : ""}
                                    </div>
                                </>
                            )}
                        </div>
                        <div style={{ display: "flex", gap: spacing.xs }}>
                            {editingSessionId === s.id ? (
                                <>
                                    <button
                                        onClick={e => saveEdit(e, s.id)}
                                        style={{
                                            fontSize: typography.fontSize.xs,
                                            padding: `${spacing.xs} ${spacing.sm}`,
                                            backgroundColor: theme.primary,
                                            color: "#fff",
                                            border: "none",
                                            borderRadius: "4px",
                                            cursor: "pointer",
                                            transition: "all 0.2s ease"
                                        }}
                                    >
                                        ✓
                                    </button>
                                    <button
                                        onClick={e => {
                                            e.stopPropagation();
                                            cancelEdit();
                                        }}
                                        style={{
                                            fontSize: typography.fontSize.xs,
                                            padding: `${spacing.xs} ${spacing.sm}`,
                                            backgroundColor: theme.bg.hover,
                                            color: theme.text.primary,
                                            border: `1px solid ${theme.border}`,
                                            borderRadius: "4px",
                                            cursor: "pointer",
                                            transition: "all 0.2s ease"
                                        }}
                                    >
                                        ✕
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button
                                        onClick={e => startEditSession(e, s)}
                                        style={{
                                            fontSize: typography.fontSize.xs,
                                            padding: `${spacing.xs} ${spacing.sm}`,
                                            backgroundColor: "transparent",
                                            color: theme.text.secondary,
                                            border: `1px solid ${theme.border}`,
                                            borderRadius: "4px",
                                            cursor: "pointer",
                                            transition: "all 0.2s ease"
                                        }}
                                        title="Edit title"
                                    >
                                        ✏️
                                    </button>
                                    <button
                                        onClick={e => handleDeleteSession(e, s.id)}
                                        style={{
                                            fontSize: typography.fontSize.xs,
                                            padding: `${spacing.xs} ${spacing.sm}`,
                                            backgroundColor: "transparent",
                                            color: theme.error,
                                            border: `1px solid ${theme.border}`,
                                            borderRadius: "4px",
                                            cursor: "pointer",
                                            transition: "all 0.2s ease"
                                        }}
                                        title="Delete session"
                                    >
                                        🗑️
                                    </button>
                                </>
                            )}
                        </div>
                    </li>
                ))}
                {sessions.length === 0 && !loading && (
                    <li style={{ 
                        fontSize: typography.fontSize.sm, 
                        color: theme.text.tertiary,
                        textAlign: "center",
                        padding: spacing.xl
                    }}>
                        No sessions yet. Click "New" to start.
                    </li>
                )}
            </ul>
        </div>
    );
}

export default SessionList;
