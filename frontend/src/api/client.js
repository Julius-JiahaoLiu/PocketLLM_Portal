// src/api/client.js

import { getToken } from "../utils/userManager";

// 使用相对路径，由 nginx 代理转发到后端
// 在 docker 中：nginx 会把 /api/* 代理到 backend:8000
// 本地开发时：需要单独启动后端或配置代理
const API_BASE = "/api/v1";

async function handleResponse(res) {
    const text = await res.text();

    if (!res.ok) {
        // 把后端返回的错误文本直接抛出去，方便你在 UI 上看到
        throw new Error(text || `Request failed with status ${res.status}`);
    }

    // 正常情况下 text 是 JSON 字符串，这里再解析
    try {
        return JSON.parse(text);
    } catch (e) {
        // 如果解析失败，把原始文本也带上，方便排查
        throw new Error(
            `Failed to parse JSON. Raw response: ${text.slice(0, 200)}`
        );
    }
}

function getHeaders() {
    const headers = {
        "Content-Type": "application/json"
    };
    const token = getToken();
    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }
    return headers;
}

export async function apiGet(path) {
    const res = await fetch(`${API_BASE}${path}`, {
        method: "GET",
        headers: getHeaders()
    });
    return handleResponse(res);
}

export async function apiPost(path, body) {
    const res = await fetch(`${API_BASE}${path}`, {
        method: "POST",
        headers: getHeaders(),
        body: body ? JSON.stringify(body) : undefined
    });
    return handleResponse(res);
}

export async function apiDelete(path) {
    const res = await fetch(`${API_BASE}${path}`, {
        method: "DELETE",
        headers: getHeaders()
    });
    return handleResponse(res);
}

