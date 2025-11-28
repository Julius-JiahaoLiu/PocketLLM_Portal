// src/components/SearchBar.js

import React, { useState } from "react";
import { spacing, typography } from "../theme";

function SearchBar({ onSearch, onClear, disabled, isSearching, hasActiveQuery, theme }) {
    const [value, setValue] = useState("");

    function handleSubmit(e) {
        e.preventDefault();
        const trimmed = value.trim();
        if (!trimmed) {
            onClear();
            return;
        }
        onSearch(trimmed);
    }

    function handleClearClick() {
        setValue("");
        onClear();
    }

    return (
        <form
            onSubmit={handleSubmit}
            style={{
                display: "flex",
                gap: spacing.sm
            }}
        >
            <div style={{ flex: 1, position: "relative" }}>
                <input
                    type="text"
                    placeholder="🔍 Search messages..."
                    value={value}
                    onChange={e => setValue(e.target.value)}
                    disabled={disabled}
                    style={{
                        width: "100%",
                        padding: `${spacing.sm} ${spacing.md}`,
                        paddingLeft: spacing.xl,
                        borderRadius: "8px",
                        border: `2px solid ${theme.border}`,
                        fontSize: typography.fontSize.base,
                        backgroundColor: theme.bg.primary,
                        color: theme.text.primary,
                        outline: "none",
                        transition: "border-color 0.2s ease"
                    }}
                    onFocus={e => e.target.style.borderColor = theme.primary}
                    onBlur={e => e.target.style.borderColor = theme.border}
                />
            </div>
            <button
                type="submit"
                disabled={disabled || isSearching}
                style={{
                    padding: `${spacing.sm} ${spacing.lg}`,
                    fontSize: typography.fontSize.sm,
                    fontWeight: typography.fontWeight.medium,
                    backgroundColor: theme.primary,
                    color: "#fff",
                    border: "none",
                    borderRadius: "8px",
                    cursor: disabled || isSearching ? "not-allowed" : "pointer",
                    opacity: disabled || isSearching ? 0.6 : 1,
                    transition: "all 0.2s ease"
                }}
            >
                {isSearching ? "Searching..." : "Search"}
            </button>
            {hasActiveQuery && (
                <button
                    type="button"
                    onClick={handleClearClick}
                    style={{
                        padding: `${spacing.sm} ${spacing.md}`,
                        fontSize: typography.fontSize.sm,
                        fontWeight: typography.fontWeight.medium,
                        backgroundColor: theme.bg.primary,
                        color: theme.text.primary,
                        border: `1px solid ${theme.border}`,
                        borderRadius: "8px",
                        cursor: "pointer",
                        transition: "all 0.2s ease"
                    }}
                >
                    Clear
                </button>
            )}
        </form>
    );
}

export default SearchBar;
