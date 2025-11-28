// src/components/UserInfo.js

import React, { useState, useEffect } from "react";
import { getUserEmail, setUserEmail } from "../utils/userManager";

export default function UserInfo() {
    const [email, setEmail] = useState("");
    const [showDetails, setShowDetails] = useState(false);
    const [tempEmail, setTempEmail] = useState("");

    useEffect(() => {
        const savedEmail = getUserEmail();
        setEmail(savedEmail || "");
        setTempEmail(savedEmail || "");
    }, []);

    function handleSaveEmail() {
        if (tempEmail.trim()) {
            setUserEmail(tempEmail);
            setEmail(tempEmail);
        }
        setShowDetails(false);
    }

    return (
        <div
            style={{
                padding: "8px 12px",
                borderTop: "1px solid #e0e0e0",
                backgroundColor: "#fafafa",
                fontSize: "12px"
            }}
        >
            {!showDetails ? (
                <button
                    onClick={() => setShowDetails(true)}
                    style={{
                        width: "100%",
                        padding: "8px",
                        border: "none",
                        backgroundColor: "transparent",
                        cursor: "pointer",
                        textAlign: "left",
                        color: "#666"
                    }}
                >
                    👤 {email || "User"}
                </button>
            ) : (
                <div>
                    <div style={{ marginBottom: "8px" }}>
                        <label style={{ display: "block", marginBottom: "4px", fontWeight: 500 }}>
                            Email (optional):
                        </label>
                        <input
                            type="email"
                            value={tempEmail}
                            onChange={(e) => setTempEmail(e.target.value)}
                            placeholder="your@email.com"
                            style={{
                                width: "100%",
                                padding: "4px",
                                borderRadius: "4px",
                                border: "1px solid #ccc",
                                boxSizing: "border-box"
                            }}
                        />
                    </div>
                    <div style={{ display: "flex", gap: "4px" }}>
                        <button
                            onClick={handleSaveEmail}
                            style={{
                                flex: 1,
                                padding: "4px",
                                backgroundColor: "#4caf50",
                                color: "white",
                                border: "none",
                                borderRadius: "4px",
                                cursor: "pointer",
                                fontSize: "11px"
                            }}
                        >
                            Save
                        </button>
                        <button
                            onClick={() => setShowDetails(false)}
                            style={{
                                flex: 1,
                                padding: "4px",
                                backgroundColor: "#999",
                                color: "white",
                                border: "none",
                                borderRadius: "4px",
                                cursor: "pointer",
                                fontSize: "11px"
                            }}
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

