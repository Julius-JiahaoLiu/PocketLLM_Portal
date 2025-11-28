// src/components/ChatWindow.js

import React, { useEffect, useRef, useState } from "react";
import { fetchSessionDetail, updateSession } from "../api/sessions";
import { sendChat } from "../api/chat";
import { rateMessage, togglePin, searchMessages, deleteMessage, createMessage } from "../api/messages";
import MessageBubble from "./MessageBubble";
import SearchBar from "./SearchBar";
import { toastManager, spacing, typography } from "../theme";

// Prompt templates for quick start
const PROMPT_TEMPLATES = [
    {
        icon: "💡",
        title: "Brainstorm Ideas",
        prompt: "Help me brainstorm creative ideas for "
    },
    {
        icon: "📝",
        title: "Write Content",
        prompt: "Write a professional "
    },
    {
        icon: "🐛",
        title: "Debug Code",
        prompt: "Help me debug this code:\n\n"
    },
    {
        icon: "📚",
        title: "Explain Concept",
        prompt: "Explain the concept of "
    },
    {
        icon: "🔍",
        title: "Research Topic",
        prompt: "Research and summarize information about "
    },
    {
        icon: "✍️",
        title: "Improve Writing",
        prompt: "Improve and refine this text:\n\n"
    },
    {
        icon: "🎯",
        title: "Plan Project",
        prompt: "Help me create a project plan for "
    },
    {
        icon: "💬",
        title: "General Chat",
        prompt: "Hello! I'd like to discuss "
    }
];

function ChatWindow({ sessionId, theme, onTitleUpdate }) {
    const [session, setSession] = useState(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [loadingSession, setLoadingSession] = useState(false);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState(null);

    const [mode, setMode] = useState("normal"); // "normal" | "search" | "pinned" | "rated"
    const [searchResults, setSearchResults] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchLoading, setSearchLoading] = useState(false);

    const [lastAssistantCachedId, setLastAssistantCachedId] = useState(null);
    
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [editTitle, setEditTitle] = useState("");
    
    const [showTemplates, setShowTemplates] = useState(false);

    const bottomRef = useRef(null);

    function scrollToBottom() {
        if (bottomRef.current) {
            bottomRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }

    async function loadSession() {
        try {
            setLoadingSession(true);
            setError(null);
            const data = await fetchSessionDetail(sessionId);
            setSession(data);

            const sorted = [...data.messages].sort(
                (a, b) =>
                    new Date(a.created_at).getTime() -
                    new Date(b.created_at).getTime()
            );
            setMessages(sorted);

            setMode("normal");
            setSearchResults([]);
            setSearchQuery("");
        } catch (e) {
            setError(e.message || "Failed to load session");
        } finally {
            setLoadingSession(false);
            setTimeout(scrollToBottom, 100);
        }
    }

    useEffect(() => {
        if (sessionId && sessionId !== "undefined") {
            loadSession();
        }
    }, [sessionId]);

    useEffect(() => {
        scrollToBottom();
    }, [messages, mode, searchResults]);
    
    useEffect(() => {
        // Show templates only when there are no messages
        setShowTemplates(messages.length === 0 && !loadingSession);
    }, [messages, loadingSession]);

    async function handleSend() {
        const prompt = input.trim();
        if (!prompt || sending || !sessionId || sessionId === "undefined") return;

        setSending(true);
        setError(null);
        const now = new Date().toISOString();

        const tempUserMessage = {
            id: "temp-user-" + Date.now(),
            session_id: sessionId,
            role: "user",
            content: prompt,
            rating: null,
            pinned: false,
            created_at: now
        };

        setMessages(prev => [...prev, tempUserMessage]);
        setInput("");

        try {
            const res = await sendChat({
                session_id: sessionId,
                prompt
            });

            const assistantMessage = {
                id: res.message_id,
                session_id: sessionId,
                role: "assistant",
                content: res.content,
                rating: null,
                pinned: false,
                created_at: new Date().toISOString()
            };

            setMessages(prev => [...prev, assistantMessage]);
            setLastAssistantCachedId(res.cached ? assistantMessage.id : null);
        } catch (e) {
            setError(e.message || "Failed to send message");
        } finally {
            setSending(false);
        }
    }

    function handleKeyDown(e) {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    }

    async function handleRate(id, rating) {
        try {
            await rateMessage(id, rating);
            setMessages(prev =>
                prev.map(m => (m.id === id ? { ...m, rating } : m))
            );
            setSearchResults(prev =>
                prev.map(m => (m.id === id ? { ...m, rating } : m))
            );
            toastManager.notify("Rating saved", "success");
        } catch (e) {
            toastManager.notify("Failed to rate message", "error");
        }
    }

    async function handleTogglePin(id) {
        try {
            const res = await togglePin(id);
            setMessages(prev =>
                prev.map(m =>
                    m.id === id ? { ...m, pinned: res.pinned } : m
                )
            );
            setSearchResults(prev =>
                prev.map(m =>
                    m.id === id ? { ...m, pinned: res.pinned } : m
                )
            );
            toastManager.notify(res.pinned ? "Message pinned" : "Message unpinned", "success");
        } catch (e) {
            toastManager.notify("Failed to toggle pin", "error");
        }
    }

    async function handleDelete(id) {
        try {
            await deleteMessage(id);
            setMessages(prev => prev.filter(m => m.id !== id));
            setSearchResults(prev => prev.filter(m => m.id !== id));
            toastManager.notify("Message deleted", "success");
        } catch (e) {
            toastManager.notify("Failed to delete message", "error");
        }
    }
    
    async function handleRenameSession() {
        if (!editTitle.trim()) {
            toastManager.notify("Title cannot be empty", "warning");
            return;
        }
        try {
            await updateSession(sessionId, editTitle.trim());
            setSession(prev => ({ ...prev, title: editTitle.trim() }));
            setIsEditingTitle(false);
            toastManager.notify("Title updated", "success");
            // Notify parent to refresh session list
            if (onTitleUpdate) {
                onTitleUpdate(sessionId, editTitle.trim());
            }
        } catch (e) {
            toastManager.notify("Failed to update title", "error");
        }
    }
    
    function startEditTitle() {
        setEditTitle(session?.title || "");
        setIsEditingTitle(true);
    }
    
    function cancelEditTitle() {
        setIsEditingTitle(false);
        setEditTitle("");
    }
    
    async function handleClearSession() {
        if (!window.confirm("Are you sure you want to clear all messages? This cannot be undone.")) {
            return;
        }
        try {
            // Delete all messages
            for (const msg of messages) {
                await deleteMessage(msg.id);
            }
            setMessages([]);
            setSearchResults([]);
            toastManager.notify("Session cleared", "success");
        } catch (e) {
            toastManager.notify("Failed to clear session", "error");
        }
    }
    
    function handleExportChat() {
        const exportData = {
            session: session?.title || "Untitled",
            exported_at: new Date().toISOString(),
            messages: messages.map(m => ({
                role: m.role,
                content: m.content,
                created_at: m.created_at,
                rating: m.rating,
                pinned: m.pinned
            }))
        };
        
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `chat-${sessionId}-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        toastManager.notify("Chat exported", "success");
    }
    
    async function handleImportChat() {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "application/json";
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            try {
                const text = await file.text();
                const data = JSON.parse(text);
                
                if (!data.messages || !Array.isArray(data.messages)) {
                    toastManager.notify("Invalid chat file format", "error");
                    return;
                }
                
                // Clear current messages first
                if (messages.length > 0) {
                    const confirm = window.confirm(
                        "This will replace all current messages. Continue?"
                    );
                    if (!confirm) return;
                    
                    for (const msg of messages) {
                        await deleteMessage(msg.id);
                    }
                }
                
                // Import messages directly
                toastManager.notify("Importing messages...", "info");
                let importedCount = 0;
                
                for (const msg of data.messages) {
                    try {
                        await createMessage(sessionId, msg.content, msg.role);
                        importedCount++;
                    } catch (err) {
                        console.error("Failed to import message:", err);
                    }
                }
                
                // Update session title if provided
                if (data.session && data.session !== session?.title) {
                    try {
                        await updateSession(sessionId, data.session);
                        if (onTitleUpdate) {
                            onTitleUpdate(sessionId, data.session);
                        }
                    } catch (err) {
                        console.error("Failed to update session title:", err);
                    }
                }
                
                // Reload session to get all messages
                await loadSession();
                toastManager.notify(`Imported ${importedCount} message(s)`, "success");
            } catch (e) {
                toastManager.notify("Failed to import chat: " + e.message, "error");
            }
        };
        input.click();
    }

    function handleClearSearch() {
        setMode("normal");
        setSearchResults([]);
        setSearchQuery("");
    }

    function getFilteredMessages() {
        if (mode === "search") {
            return searchResults;
        } else if (mode === "pinned") {
            return messages.filter(m => m.pinned);
        } else if (mode === "rated") {
            return messages.filter(m => m.rating);
        }
        return messages;
    }

    function handleShowPinned() {
        setMode("pinned");
    }

    function handleShowRated() {
        setMode("rated");
    }

    function handleShowAll() {
        setMode("normal");
        setSearchResults([]);
        setSearchQuery("");
    }

    async function handleSearch(query) {
        if (!query.trim()) {
            handleClearSearch();
            return;
        }
        if (!sessionId || sessionId === "undefined") {
            toastManager.notify("Please select a session first", "warning");
            return;
        }
        setSearchLoading(true);
        setSearchQuery(query);
        try {
            const res = await searchMessages(sessionId, query);
            setSearchResults(res.results);
            setMode("search");
            toastManager.notify(`Found ${res.results.length} result(s)`, "info");
        } catch (e) {
            toastManager.notify(e.message || "Search failed", "error");
        } finally {
            setSearchLoading(false);
        }
    }

    function handleTemplateClick(template) {
        setInput(template.prompt);
        setShowTemplates(false);
        // Focus on textarea
        setTimeout(() => {
            const textarea = document.querySelector('textarea[placeholder*="Type a message"]');
            if (textarea) {
                textarea.focus();
                // Move cursor to end
                textarea.selectionStart = textarea.selectionEnd = template.prompt.length;
            }
        }, 100);
    }
    
    function renderPromptTemplates() {
        return (
            <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                gap: spacing.md,
                padding: spacing.lg,
                maxWidth: "900px",
                margin: "0 auto"
            }}>
                {PROMPT_TEMPLATES.map((template, index) => (
                    <button
                        key={index}
                        onClick={() => handleTemplateClick(template)}
                        style={{
                            padding: spacing.lg,
                            backgroundColor: theme.bg.primary,
                            border: `2px solid ${theme.border}`,
                            borderRadius: "12px",
                            cursor: "pointer",
                            transition: "all 0.2s ease",
                            textAlign: "left",
                            display: "flex",
                            flexDirection: "column",
                            gap: spacing.sm
                        }}
                        onMouseEnter={e => {
                            e.currentTarget.style.borderColor = theme.primary;
                            e.currentTarget.style.transform = "translateY(-2px)";
                            e.currentTarget.style.boxShadow = `0 4px 12px ${theme.shadowMd}`;
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.borderColor = theme.border;
                            e.currentTarget.style.transform = "translateY(0)";
                            e.currentTarget.style.boxShadow = "none";
                        }}
                    >
                        <div style={{ fontSize: "32px" }}>{template.icon}</div>
                        <div style={{
                            fontSize: typography.fontSize.base,
                            fontWeight: typography.fontWeight.semibold,
                            color: theme.text.primary
                        }}>
                            {template.title}
                        </div>
                        <div style={{
                            fontSize: typography.fontSize.sm,
                            color: theme.text.secondary,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap"
                        }}>
                            {template.prompt}
                        </div>
                    </button>
                ))}
            </div>
        );
    }

    function renderMessages() {
        const list = getFilteredMessages();
        
        if (list.length === 0) {
            let emptyMessage = "No messages yet. Start chatting!";
            if (mode === "search") {
                emptyMessage = "No messages match your search.";
            } else if (mode === "pinned") {
                emptyMessage = "No pinned messages.";
            } else if (mode === "rated") {
                emptyMessage = "No rated messages.";
            }
            
            // Show templates for empty normal mode
            if (mode === "normal" && showTemplates) {
                return (
                    <div>
                        <div style={{ 
                            textAlign: "center", 
                            padding: `${spacing.xxl} ${spacing.lg} ${spacing.lg}`,
                            color: theme.text.primary
                        }}>
                            <div style={{ fontSize: "48px", marginBottom: spacing.md }}>💬</div>
                            <h2 style={{ 
                                fontSize: typography.fontSize.xl,
                                fontWeight: typography.fontWeight.bold,
                                margin: `0 0 ${spacing.sm} 0`
                            }}>
                                Start a Conversation
                            </h2>
                            <p style={{ 
                                fontSize: typography.fontSize.base,
                                color: theme.text.secondary,
                                margin: 0
                            }}>
                                Choose a template below or type your own message
                            </p>
                        </div>
                        {renderPromptTemplates()}
                    </div>
                );
            }
            
            return (
                <div style={{ 
                    textAlign: "center", 
                    padding: spacing.xxl,
                    color: theme.text.tertiary,
                    fontSize: typography.fontSize.base
                }}>
                    <div style={{ fontSize: "48px", marginBottom: spacing.md }}>💬</div>
                    <p>{emptyMessage}</p>
                </div>
            );
        }

        return list.map(msg => (
            <MessageBubble
                key={msg.id}
                message={msg}
                onRate={handleRate}
                onTogglePin={handleTogglePin}
                onDelete={handleDelete}
                isCached={msg.id === lastAssistantCachedId}
                theme={theme}
                searchQuery={mode === "search" ? searchQuery : null}
            />
        ));
    }
    
    function renderLoadingSkeleton() {
        return (
            <div style={{ padding: spacing.lg }}>
                {[1, 2, 3].map(i => (
                    <div 
                        key={i}
                        style={{
                            height: "80px",
                            backgroundColor: theme.bg.secondary,
                            borderRadius: "12px",
                            marginBottom: spacing.md,
                            animation: "pulse 1.5s ease-in-out infinite",
                            opacity: 1 - (i * 0.2)
                        }}
                    />
                ))}
                <style>{`
                    @keyframes pulse {
                        0%, 100% { opacity: 1; }
                        50% { opacity: 0.5; }
                    }
                `}</style>
            </div>
        );
    }

    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                height: "100%",
                backgroundColor: theme.bg.primary
            }}
        >
            <div
                style={{
                    padding: spacing.lg,
                    borderBottom: `1px solid ${theme.border}`,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    backgroundColor: theme.bg.secondary,
                    boxShadow: `0 2px 4px ${theme.shadow}`
                }}
            >
                <div style={{ flex: 1 }}>
                    {isEditingTitle ? (
                        <div style={{ display: "flex", gap: spacing.sm, alignItems: "center" }}>
                            <input
                                type="text"
                                value={editTitle}
                                onChange={e => setEditTitle(e.target.value)}
                                onKeyDown={e => {
                                    if (e.key === "Enter") handleRenameSession();
                                    if (e.key === "Escape") cancelEditTitle();
                                }}
                                autoFocus
                                style={{
                                    flex: 1,
                                    padding: spacing.sm,
                                    fontSize: typography.fontSize.lg,
                                    fontWeight: typography.fontWeight.semibold,
                                    border: `2px solid ${theme.primary}`,
                                    borderRadius: "6px",
                                    backgroundColor: theme.bg.primary,
                                    color: theme.text.primary,
                                    outline: "none"
                                }}
                            />
                            <button
                                onClick={handleRenameSession}
                                style={{
                                    padding: `${spacing.xs} ${spacing.md}`,
                                    fontSize: typography.fontSize.sm,
                                    backgroundColor: theme.primary,
                                    color: "#fff",
                                    border: "none",
                                    borderRadius: "6px",
                                    cursor: "pointer",
                                    fontWeight: typography.fontWeight.medium
                                }}
                            >
                                ✓
                            </button>
                            <button
                                onClick={cancelEditTitle}
                                style={{
                                    padding: `${spacing.xs} ${spacing.md}`,
                                    fontSize: typography.fontSize.sm,
                                    backgroundColor: theme.bg.hover,
                                    color: theme.text.primary,
                                    border: `1px solid ${theme.border}`,
                                    borderRadius: "6px",
                                    cursor: "pointer"
                                }}
                            >
                                ✕
                            </button>
                        </div>
                    ) : (
                        <div style={{ display: "flex", alignItems: "center", gap: spacing.sm }}>
                            <h2 style={{ 
                                fontSize: typography.fontSize.xl, 
                                fontWeight: typography.fontWeight.bold,
                                margin: 0,
                                color: theme.text.primary
                            }}>
                                {session && session.title ? session.title : "Chat"}
                            </h2>
                            <button
                                onClick={startEditTitle}
                                style={{
                                    padding: spacing.xs,
                                    fontSize: typography.fontSize.sm,
                                    backgroundColor: "transparent",
                                    color: theme.text.secondary,
                                    border: "none",
                                    borderRadius: "4px",
                                    cursor: "pointer",
                                    opacity: 0.6,
                                    transition: "opacity 0.2s"
                                }}
                                title="Rename session"
                            >
                                ✏️
                            </button>
                        </div>
                    )}
                    {mode === "search" && (
                        <div
                            style={{
                                fontSize: typography.fontSize.xs,
                                color: theme.primary,
                                marginTop: spacing.xs
                            }}
                        >
                            🔍 Search: {searchQuery}
                        </div>
                    )}
                </div>
                <div style={{ display: "flex", gap: spacing.sm }}>
                    <button
                        onClick={handleImportChat}
                        style={{
                            padding: `${spacing.sm} ${spacing.md}`,
                            fontSize: typography.fontSize.sm,
                            backgroundColor: theme.bg.primary,
                            color: theme.text.primary,
                            border: `1px solid ${theme.border}`,
                            borderRadius: "6px",
                            cursor: "pointer",
                            transition: "all 0.2s ease"
                        }}
                        title="Import chat from JSON"
                    >
                        📤 Import
                    </button>
                    <button
                        onClick={handleExportChat}
                        disabled={messages.length === 0}
                        style={{
                            padding: `${spacing.sm} ${spacing.md}`,
                            fontSize: typography.fontSize.sm,
                            backgroundColor: theme.bg.primary,
                            color: theme.text.primary,
                            border: `1px solid ${theme.border}`,
                            borderRadius: "6px",
                            cursor: messages.length === 0 ? "not-allowed" : "pointer",
                            opacity: messages.length === 0 ? 0.5 : 1,
                            transition: "all 0.2s ease"
                        }}
                        title="Export chat to JSON"
                    >
                        📥 Export
                    </button>
                    <button
                        onClick={handleClearSession}
                        disabled={messages.length === 0}
                        style={{
                            padding: `${spacing.sm} ${spacing.md}`,
                            fontSize: typography.fontSize.sm,
                            backgroundColor: theme.bg.primary,
                            color: theme.error,
                            border: `1px solid ${theme.border}`,
                            borderRadius: "6px",
                            cursor: messages.length === 0 ? "not-allowed" : "pointer",
                            opacity: messages.length === 0 ? 0.5 : 1,
                            transition: "all 0.2s ease"
                        }}
                        title="Clear session"
                    >
                        🗑️ Clear
                    </button>
                </div>
            </div>

            <div
                style={{
                    padding: spacing.md,
                    borderBottom: `1px solid ${theme.border}`,
                    backgroundColor: theme.bg.secondary
                }}
            >
                <SearchBar
                    onSearch={handleSearch}
                    onClear={handleClearSearch}
                    disabled={loadingSession}
                    isSearching={searchLoading}
                    hasActiveQuery={mode === "search"}
                    theme={theme}
                />
                <div style={{ display: "flex", gap: spacing.sm, marginTop: spacing.sm, flexWrap: "wrap" }}>
                    <button
                        onClick={handleShowAll}
                        disabled={loadingSession}
                        style={{
                            padding: `${spacing.xs} ${spacing.md}`,
                            fontSize: typography.fontSize.sm,
                            backgroundColor: mode === "normal" ? theme.primary : theme.bg.primary,
                            color: mode === "normal" ? "#fff" : theme.text.primary,
                            border: mode === "normal" ? "none" : `1px solid ${theme.border}`,
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontWeight: typography.fontWeight.medium,
                            transition: "all 0.2s ease"
                        }}
                    >
                        All
                    </button>
                    <button
                        onClick={handleShowPinned}
                        disabled={loadingSession}
                        style={{
                            padding: `${spacing.xs} ${spacing.md}`,
                            fontSize: typography.fontSize.sm,
                            backgroundColor: mode === "pinned" ? theme.pinned : theme.bg.primary,
                            color: mode === "pinned" ? "#fff" : theme.text.primary,
                            border: mode === "pinned" ? "none" : `1px solid ${theme.border}`,
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontWeight: typography.fontWeight.medium,
                            transition: "all 0.2s ease"
                        }}
                    >
                        📌 Pinned
                    </button>
                    <button
                        onClick={handleShowRated}
                        disabled={loadingSession}
                        style={{
                            padding: `${spacing.xs} ${spacing.md}`,
                            fontSize: typography.fontSize.sm,
                            backgroundColor: mode === "rated" ? theme.success : theme.bg.primary,
                            color: mode === "rated" ? "#fff" : theme.text.primary,
                            border: mode === "rated" ? "none" : `1px solid ${theme.border}`,
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontWeight: typography.fontWeight.medium,
                            transition: "all 0.2s ease"
                        }}
                    >
                        ⭐ Rated
                    </button>
                </div>
            </div>

            <div
                style={{
                    flex: 1,
                    padding: spacing.lg,
                    overflowY: "auto",
                    backgroundColor: theme.bg.tertiary
                }}
            >
                {loadingSession && renderLoadingSkeleton()}
                {error && (
                    <div style={{ 
                        padding: spacing.md,
                        backgroundColor: theme.error + "20",
                        color: theme.error,
                        borderRadius: "8px",
                        fontSize: typography.fontSize.sm,
                        border: `1px solid ${theme.error}`
                    }}>
                        ⚠️ {error}
                    </div>
                )}
                {!loadingSession && renderMessages()}
                <div ref={bottomRef} />
            </div>

            <div
                style={{
                    borderTop: `1px solid ${theme.border}`,
                    padding: spacing.lg,
                    backgroundColor: theme.bg.secondary,
                    boxShadow: `0 -2px 8px ${theme.shadow}`
                }}
            >
                <textarea
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a message... (Enter to send, Shift+Enter for new line)"
                    rows={3}
                    style={{
                        width: "100%",
                        resize: "none",
                        padding: spacing.md,
                        borderRadius: "8px",
                        border: `2px solid ${theme.border}`,
                        fontFamily: typography.fontFamily,
                        fontSize: typography.fontSize.base,
                        backgroundColor: theme.bg.primary,
                        color: theme.text.primary,
                        outline: "none",
                        transition: "border-color 0.2s ease",
                        lineHeight: typography.lineHeight.normal
                    }}
                    onFocus={e => e.target.style.borderColor = theme.primary}
                    onBlur={e => e.target.style.borderColor = theme.border}
                />
                <div
                    style={{
                        marginTop: spacing.sm,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center"
                    }}
                >
                    <div style={{ 
                        fontSize: typography.fontSize.xs, 
                        color: theme.text.tertiary 
                    }}>
                        {input.length > 0 && `${input.length} characters`}
                    </div>
                    <button
                        type="button"
                        onClick={handleSend}
                        disabled={sending || !input.trim()}
                        style={{
                            padding: `${spacing.sm} ${spacing.xl}`,
                            fontSize: typography.fontSize.base,
                            fontWeight: typography.fontWeight.semibold,
                            backgroundColor: sending || !input.trim() ? theme.bg.hover : theme.primary,
                            color: "#fff",
                            border: "none",
                            borderRadius: "8px",
                            cursor: sending || !input.trim() ? "not-allowed" : "pointer",
                            transition: "all 0.2s ease",
                            boxShadow: sending || !input.trim() ? "none" : `0 2px 8px ${theme.shadowMd}`
                        }}
                    >
                        {sending ? "Sending..." : "Send ➤"}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ChatWindow;
