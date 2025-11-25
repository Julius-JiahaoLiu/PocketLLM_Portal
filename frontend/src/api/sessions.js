// src/api/sessions.js

import { apiGet, apiPost, apiDelete } from "./client";

// ✅ 默认用户 ID（测试阶段写死，后端要求每个 session 归属一个 user）
const DEFAULT_USER_ID = "00000000-0000-0000-0000-000000000001";

// 获取所有会话
export async function fetchSessions() {
    // GET /sessions?user_id=...
    return apiGet(`/sessions?user_id=${DEFAULT_USER_ID}`);
}

// 创建新会话
export async function createSession(title) {
    const body = title ? { title } : {};
    // POST /sessions?user_id=...
    return apiPost(`/sessions?user_id=${DEFAULT_USER_ID}`, body);
}

// 获取会话详情
export async function fetchSessionDetail(id) {
    return apiGet(`/sessions/${id}`);
}

// 删除会话
export async function deleteSession(id) {
    return apiDelete(`/sessions/${id}`);
}
