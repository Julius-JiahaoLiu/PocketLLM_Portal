// src/components/SearchBar.js

import React, { useState } from "react";

function SearchBar({ onSearch, onClear, disabled, isSearching, hasActiveQuery }) {
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
                gap: "8px",
                marginBottom: "8px"
            }}
        >
            <input
                type="text"
                placeholder="Search this session"
                value={value}
                onChange={e => setValue(e.target.value)}
                disabled={disabled}
                style={{
                    flex: 1,
                    padding: "6px 8px",
                    borderRadius: "6px",
                    border: "1px solid #ccc",
                    fontSize: "12px"
                }}
            />
            <button
                type="submit"
                disabled={disabled}
                style={{
                    padding: "4px 8px",
                    fontSize: "12px",
                    cursor: "pointer"
                }}
            >
                {isSearching ? "Searching..." : "Search"}
            </button>
            {hasActiveQuery && (
                <button
                    type="button"
                    onClick={handleClearClick}
                    style={{
                        padding: "4px 8px",
                        fontSize: "12px",
                        cursor: "pointer"
                    }}
                >
                    Clear
                </button>
            )}
        </form>
    );
}

export default SearchBar;
