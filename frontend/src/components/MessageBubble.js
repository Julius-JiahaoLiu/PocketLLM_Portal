// src/components/MessageBubble.js

import React from "react";

function MessageBubble({ message, onRate, onTogglePin, isCached }) {
    const isUser = message.role === "user";

    const containerAlign = isUser ? "flex-end" : "flex-start";
    const bubbleColor = isUser ? "#e3f2fd" : "#f5f5f5";

    return (
        <div
            style={{
                display: "flex",
                justifyContent: containerAlign,
                marginBottom: "8px"
            }}
        >
            <div
                style={{
                    maxWidth: "70%",
                    borderRadius: "10px",
                    padding: "8px 10px",
                    backgroundColor: bubbleColor,
                    fontSize: "14px"
                }}
            >
                <div
                    style={{
                        fontSize: "11px",
                        color: "#777",
                        marginBottom: "4px"
                    }}
                >
                    {isUser ? "You" : "Assistant"} ·{" "}
                    {new Date(message.created_at).toLocaleTimeString()}
                    {isCached && !isUser && (
                        <span style={{ marginLeft: "6px", color: "#1976d2" }}>
              cached
            </span>
                    )}
                    {message.pinned && (
                        <span style={{ marginLeft: "6px", color: "#ff9800" }}>
              pinned
            </span>
                    )}
                </div>

                <div style={{ whiteSpace: "pre-wrap" }}>{message.content}</div>

                {!isUser && (
                    <div
                        style={{
                            display: "flex",
                            gap: "8px",
                            marginTop: "6px",
                            fontSize: "11px"
                        }}
                    >
                        <button
                            type="button"
                            onClick={() => onRate(message.id, "up")}
                            style={{
                                cursor: "pointer",
                                padding: "2px 6px",
                                borderRadius: "4px",
                                border:
                                    message.rating === "up"
                                        ? "1px solid #4caf50"
                                        : "1px solid #ccc"
                            }}
                        >
                            👍
                        </button>
                        <button
                            type="button"
                            onClick={() => onRate(message.id, "down")}
                            style={{
                                cursor: "pointer",
                                padding: "2px 6px",
                                borderRadius: "4px",
                                border:
                                    message.rating === "down"
                                        ? "1px solid #f44336"
                                        : "1px solid #ccc"
                            }}
                        >
                            👎
                        </button>
                        <button
                            type="button"
                            onClick={() => onTogglePin(message.id)}
                            style={{
                                cursor: "pointer",
                                padding: "2px 6px",
                                borderRadius: "4px",
                                border: message.pinned
                                    ? "1px solid #ff9800"
                                    : "1px solid #ccc"
                            }}
                        >
                            📌
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default MessageBubble;
