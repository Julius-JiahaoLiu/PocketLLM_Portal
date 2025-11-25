// src/api/chat.js

import { apiPost } from "./client";

export async function sendChat(payload) {
    // payload: { session_id: string, prompt: string }
    return apiPost("/chat", payload);
}
