// src/api/sessions.js

import { apiGet, apiPost, apiDelete } from "./client";
import { getUserId } from "../utils/userManager";

// 获取所有会话
export async function fetchSessions() {
    const userId = getUserId();
    // GET /sessions?user_id=...
    return apiGet(`/sessions?user_id=${userId}`);
}

// 创建新会话
export async function createSession(title) {
    const userId = getUserId();
    // backend expects `user_id` inside the POST body (schemas.SessionCreate)
    const body = {
        user_id: userId,
        ...(title ? { title } : {})
    };
    // POST /sessions
    return apiPost(`/sessions`, body);
}

// 获取会话详情
export async function fetchSessionDetail(id) {
    return apiGet(`/sessions/${id}`);
}

// 删除会话
export async function deleteSession(id) {
    return apiDelete(`/sessions/${id}`);
}
