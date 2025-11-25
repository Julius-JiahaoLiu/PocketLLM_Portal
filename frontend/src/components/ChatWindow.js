// src/components/ChatWindow.js

import React, { useEffect, useRef, useState } from "react";
import { fetchSessionDetail } from "../api/sessions";
import { sendChat } from "../api/chat";
import { rateMessage, togglePin, searchMessages } from "../api/messages";
import MessageBubble from "./MessageBubble";
import SearchBar from "./SearchBar";

function ChatWindow({ sessionId }) {
    const [session, setSession] = useState(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [loadingSession, setLoadingSession] = useState(false);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState(null);

    const [mode, setMode] = useState("normal"); // "normal" | "search"
    const [searchResults, setSearchResults] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchLoading, setSearchLoading] = useState(false);

    const [lastAssistantCachedId, setLastAssistantCachedId] = useState(null);

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
        loadSession();
    }, [sessionId]);

    useEffect(() => {
        scrollToBottom();
    }, [messages, mode, searchResults]);

    async function handleSend() {
        const prompt = input.trim();
        if (!prompt || sending) return;

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
        } catch (e) {
            alert("Failed to rate message");
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
        } catch (e) {
            alert("Failed to toggle pin");
        }
    }

    async function handleSearch(query) {
        if (!query.trim()) {
            handleClearSearch();
            return;
        }
        setSearchLoading(true);
        setSearchQuery(query);
        try {
            const res = await searchMessages(sessionId, query);
            setSearchResults(res.results);
            setMode("search");
        } catch (e) {
            alert(e.message || "Search failed");
        } finally {
            setSearchLoading(false);
        }
    }

    function handleClearSearch() {
        setMode("normal");
        setSearchResults([]);
        setSearchQuery("");
    }

    function renderMessages() {
        const list = mode === "normal" ? messages : searchResults;
        if (list.length === 0) {
            return (
                <p style={{ fontSize: "13px", color: "#777" }}>
                    {mode === "normal"
                        ? "No messages yet. Say something to start the chat."
                        : "No messages match your search."}
                </p>
            );
        }

        return list.map(msg => (
            <MessageBubble
                key={msg.id}
                message={msg}
                onRate={handleRate}
                onTogglePin={handleTogglePin}
                isCached={msg.id === lastAssistantCachedId}
            />
        ));
    }

    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                height: "100%"
            }}
        >
            <div
                style={{
                    padding: "10px 16px",
                    borderBottom: "1px solid #e0e0e0",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                }}
            >
                <div>
                    <h2 style={{ fontSize: "16px", margin: 0 }}>
                        {session && session.title ? session.title : "Chat"}
                    </h2>
                    <div
                        style={{
                            fontSize: "11px",
                            color: "#777"
                        }}
                    >
                        Session {sessionId}
                    </div>
                </div>
                {mode === "search" && (
                    <div
                        style={{
                            fontSize: "11px",
                            color: "#1976d2"
                        }}
                    >
                        Searching: {searchQuery}
                    </div>
                )}
            </div>

            <div
                style={{
                    padding: "8px 16px",
                    borderBottom: "1px solid #f0f0f0"
                }}
            >
                <SearchBar
                    onSearch={handleSearch}
                    onClear={handleClearSearch}
                    disabled={loadingSession}
                    isSearching={searchLoading}
                    hasActiveQuery={mode === "search"}
                />
            </div>

            <div
                style={{
                    flex: 1,
                    padding: "12px 16px",
                    overflowY: "auto",
                    backgroundColor: "#fafafa"
                }}
            >
                {loadingSession && <p>Loading messages...</p>}
                {error && (
                    <p style={{ color: "red", fontSize: "12px" }}>{error}</p>
                )}
                {!loadingSession && renderMessages()}
                <div ref={bottomRef} />
            </div>

            <div
                style={{
                    borderTop: "1px solid #e0e0e0",
                    padding: "8px 16px"
                }}
            >
        <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message. Enter = send, Shift+Enter = newline."
            rows={3}
            style={{
                width: "100%",
                resize: "none",
                padding: "8px",
                borderRadius: "6px",
                border: "1px solid #ccc",
                fontFamily: "inherit",
                fontSize: "14px"
            }}
        />
                <div
                    style={{
                        marginTop: "6px",
                        display: "flex",
                        justifyContent: "flex-end"
                    }}
                >
                    <button
                        type="button"
                        onClick={handleSend}
                        disabled={sending || !input.trim()}
                        style={{
                            padding: "6px 12px",
                            fontSize: "13px",
                            cursor: sending ? "default" : "pointer"
                        }}
                    >
                        {sending ? "Sending..." : "Send"}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ChatWindow;
