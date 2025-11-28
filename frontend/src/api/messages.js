// src/api/messages.js

import { apiGet, apiPost } from "./client";

export async function fetchMessage(id) {
    return apiGet(`/messages/${id}`);
}

export async function rateMessage(id, rating) {
    // rating: "up" | "down"
    return apiPost(`/messages/${id}/rate`, { rating });
}

export async function togglePin(id) {
    return apiPost(`/messages/${id}/pin`);
}

export async function searchMessages(sessionId, query, limit = 20) {
    const encoded = encodeURIComponent(query);
    return apiGet(`/sessions/${sessionId}/search?q=${encoded}&limit=${limit}`);
}

export async function deleteMessage(id) {
    return apiPost(`/messages/${id}/delete`);
}

export async function createMessage(sessionId, content, role = "user") {
    return apiPost(`/sessions/${sessionId}/messages`, { content, role });
}
