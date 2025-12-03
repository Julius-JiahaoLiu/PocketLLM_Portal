// src/components/MessageBubble.js

import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import { toastManager, spacing, typography } from "../theme";

function MessageBubble({ message, onRate, onTogglePin, onDelete, isCached, theme, searchQuery }) {
    const [showActions, setShowActions] = useState(false);
    const isUser = message.role === "user";

    const containerAlign = isUser ? "flex-end" : "flex-start";
    const bubbleColor = isUser ? theme.userBg : theme.assistantBg;
    const textColor = isUser ? theme.userText : theme.assistantText;

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(message.content);
            toastManager.notify("Message copied", "success");
        } catch (err) {
            toastManager.notify("Failed to copy", "error");
        }
    };

    const handleDelete = () => {
        if (window.confirm("Delete this message?")) {
            onDelete(message.id);
        }
    };

    // Highlight search query in content
    const renderContent = () => {
        if (!searchQuery) {
            return message.content;
        }
        
        const parts = message.content.split(new RegExp(`(${searchQuery})`, 'gi'));
        return (
            <>
                {parts.map((part, i) => 
                    part.toLowerCase() === searchQuery.toLowerCase() ? (
                        <mark 
                            key={i}
                            style={{
                                backgroundColor: "#ffd700",
                                color: "#000",
                                padding: "2px 4px",
                                borderRadius: "3px",
                                fontWeight: typography.fontWeight.semibold
                            }}
                        >
                            {part}
                        </mark>
                    ) : (
                        <span key={i}>{part}</span>
                    )
                )}
            </>
        );
    };

    return (
        <div
            style={{
                display: "flex",
                justifyContent: containerAlign,
                marginBottom: spacing.md,
                gap: spacing.sm,
                animation: "fadeIn 0.3s ease"
            }}
            onMouseEnter={() => setShowActions(true)}
            onMouseLeave={() => setShowActions(false)}
        >
            <div
                style={{
                    maxWidth: "75%",
                    borderRadius: "16px",
                    padding: `${spacing.md} ${spacing.lg}`,
                    backgroundColor: bubbleColor,
                    color: textColor,
                    fontSize: typography.fontSize.base,
                    boxShadow: `0 2px 8px ${theme.shadow}`,
                    border: isUser ? "none" : `1px solid ${theme.border}`,
                    transition: "all 0.2s ease",
                    transform: showActions ? "translateY(-2px)" : "translateY(0)",
                    boxShadow: showActions ? `0 4px 16px ${theme.shadowMd}` : `0 2px 8px ${theme.shadow}`
                }}
            >
                <div
                    style={{
                        fontSize: typography.fontSize.xs,
                        color: isUser ? "rgba(255,255,255,0.8)" : theme.text.tertiary,
                        marginBottom: spacing.sm,
                        display: "flex",
                        gap: spacing.sm,
                        flexWrap: "wrap",
                        alignItems: "center"
                    }}
                >
                    <span style={{ fontWeight: typography.fontWeight.semibold }}>
                        {isUser ? "You" : "Assistant"}
                    </span>
                    <span>·</span>
                    <span>{new Date(message.created_at).toLocaleTimeString()}</span>
                    {isCached && !isUser && (
                        <span 
                            style={{ 
                                color: theme.cached, 
                                fontWeight: typography.fontWeight.medium,
                                backgroundColor: theme.primaryLight,
                                padding: "2px 6px",
                                borderRadius: "4px",
                                fontSize: typography.fontSize.xs
                            }}
                        >
                            ⚡ Cached
                        </span>
                    )}
                    {message.pinned && (
                        <span 
                            style={{ 
                                color: theme.pinned, 
                                fontWeight: typography.fontWeight.medium,
                                backgroundColor: isUser ? "rgba(255,255,255,0.2)" : theme.bg.hover,
                                padding: "2px 6px",
                                borderRadius: "4px",
                                fontSize: typography.fontSize.xs
                            }}
                        >
                            📌 Pinned
                        </span>
                    )}
                </div>

                <div 
                    style={{ 
                        wordBreak: "break-word",
                        lineHeight: typography.lineHeight.relaxed
                    }}
                    className="markdown-content"
                >
                    {searchQuery ? (
                        renderContent()
                    ) : (
                        <ReactMarkdown>{message.content}</ReactMarkdown>
                    )}
                </div>

                {!isUser && showActions && (
                    <div
                        style={{
                            display: "flex",
                            gap: spacing.sm,
                            marginTop: spacing.md,
                            fontSize: typography.fontSize.sm,
                            flexWrap: "wrap",
                            animation: "fadeIn 0.2s ease"
                        }}
                    >
                        <button
                            type="button"
                            onClick={() => onRate(message.id, "up")}
                            style={{
                                cursor: "pointer",
                                padding: `${spacing.xs} ${spacing.sm}`,
                                borderRadius: "6px",
                                border: message.rating === "up"
                                    ? `2px solid ${theme.success}`
                                    : `1px solid ${theme.border}`,
                                backgroundColor: message.rating === "up" ? theme.success : "transparent",
                                color: message.rating === "up" ? "#fff" : theme.text.primary,
                                transition: "all 0.2s ease",
                                fontSize: typography.fontSize.base
                            }}
                            title="Upvote"
                        >
                            👍
                        </button>
                        <button
                            type="button"
                            onClick={() => onRate(message.id, "down")}
                            style={{
                                cursor: "pointer",
                                padding: `${spacing.xs} ${spacing.sm}`,
                                borderRadius: "6px",
                                border: message.rating === "down"
                                    ? `2px solid ${theme.error}`
                                    : `1px solid ${theme.border}`,
                                backgroundColor: message.rating === "down" ? theme.error : "transparent",
                                color: message.rating === "down" ? "#fff" : theme.text.primary,
                                transition: "all 0.2s ease",
                                fontSize: typography.fontSize.base
                            }}
                            title="Downvote"
                        >
                            👎
                        </button>
                        <button
                            type="button"
                            onClick={() => onTogglePin(message.id)}
                            style={{
                                cursor: "pointer",
                                padding: `${spacing.xs} ${spacing.sm}`,
                                borderRadius: "6px",
                                border: message.pinned
                                    ? `2px solid ${theme.pinned}`
                                    : `1px solid ${theme.border}`,
                                backgroundColor: message.pinned ? theme.pinned : "transparent",
                                color: message.pinned ? "#fff" : theme.text.primary,
                                transition: "all 0.2s ease",
                                fontSize: typography.fontSize.base
                            }}
                            title="Pin message"
                        >
                            📌
                        </button>
                        <button
                            type="button"
                            onClick={handleCopy}
                            style={{
                                cursor: "pointer",
                                padding: `${spacing.xs} ${spacing.sm}`,
                                borderRadius: "6px",
                                border: `1px solid ${theme.border}`,
                                backgroundColor: "transparent",
                                color: theme.text.primary,
                                transition: "all 0.2s ease",
                                fontSize: typography.fontSize.base
                            }}
                            title="Copy message"
                        >
                            📋
                        </button>
                        <button
                            type="button"
                            onClick={handleDelete}
                            style={{
                                cursor: "pointer",
                                padding: `${spacing.xs} ${spacing.sm}`,
                                borderRadius: "6px",
                                border: `1px solid ${theme.border}`,
                                backgroundColor: "transparent",
                                color: theme.error,
                                transition: "all 0.2s ease",
                                fontSize: typography.fontSize.base
                            }}
                            title="Delete this Q&A pair"
                        >
                            🗑️
                        </button>
                    </div>
                )}

                {isUser && showActions && (
                    <div
                        style={{
                            display: "flex",
                            gap: spacing.sm,
                            marginTop: spacing.md,
                            animation: "fadeIn 0.2s ease"
                        }}
                    >
                        <button
                            type="button"
                            onClick={handleCopy}
                            style={{
                                cursor: "pointer",
                                padding: `${spacing.xs} ${spacing.sm}`,
                                borderRadius: "6px",
                                border: "1px solid rgba(255,255,255,0.3)",
                                backgroundColor: "rgba(255,255,255,0.1)",
                                color: "#fff",
                                fontSize: typography.fontSize.sm,
                                transition: "all 0.2s ease"
                            }}
                            title="Copy message"
                        >
                            📋
                        </button>
                    </div>
                )}
            </div>
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(4px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                
                .markdown-content h1,
                .markdown-content h2,
                .markdown-content h3,
                .markdown-content h4,
                .markdown-content h5,
                .markdown-content h6 {
                    margin-top: 16px;
                    margin-bottom: 8px;
                    font-weight: 600;
                }
                
                .markdown-content h1 { font-size: 1.5em; }
                .markdown-content h2 { font-size: 1.3em; }
                .markdown-content h3 { font-size: 1.1em; }
                
                .markdown-content p {
                    margin: 8px 0;
                }
                
                .markdown-content code {
                    background-color: rgba(0, 0, 0, 0.05);
                    padding: 2px 6px;
                    border-radius: 3px;
                    font-family: 'Courier New', monospace;
                    font-size: 0.9em;
                }
                
                .markdown-content pre {
                    background-color: rgba(0, 0, 0, 0.05);
                    padding: 12px;
                    border-radius: 6px;
                    overflow-x: auto;
                    margin: 12px 0;
                }
                
                .markdown-content pre code {
                    background-color: transparent;
                    padding: 0;
                }
                
                .markdown-content ul,
                .markdown-content ol {
                    margin: 8px 0;
                    padding-left: 24px;
                }
                
                .markdown-content li {
                    margin: 4px 0;
                }
                
                .markdown-content blockquote {
                    border-left: 4px solid rgba(0, 0, 0, 0.1);
                    padding-left: 12px;
                    margin: 12px 0;
                    color: rgba(0, 0, 0, 0.6);
                }
                
                .markdown-content a {
                    color: #0066ff;
                    text-decoration: none;
                }
                
                .markdown-content a:hover {
                    text-decoration: underline;
                }
                
                .markdown-content strong {
                    font-weight: 600;
                }
                
                .markdown-content em {
                    font-style: italic;
                }
            `}</style>
        </div>
    );
}

export default MessageBubble;
