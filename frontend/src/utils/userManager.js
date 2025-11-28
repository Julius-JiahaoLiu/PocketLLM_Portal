// src/utils/userManager.js

const TOKEN_KEY = "pocketllm_token";
const USER_ID_KEY = "pocketllm_user_id";
const USER_EMAIL_KEY = "pocketllm_user_email";

/**
 * 获取 JWT token
 */
export function getToken() {
    return localStorage.getItem(TOKEN_KEY);
}

/**
 * 设置 JWT token（登录后调用）
 */
export function setToken(token) {
    if (token) {
        localStorage.setItem(TOKEN_KEY, token);
    }
}

/**
 * 获取用户 ID
 */
export function getUserId() {
    return localStorage.getItem(USER_ID_KEY);
}

/**
 * 设置用户 ID（登录后调用）
 */
export function setUserId(userId) {
    if (userId) {
        localStorage.setItem(USER_ID_KEY, userId);
    }
}

/**
 * 获取用户邮箱（可选，用于显示）
 */
export function getUserEmail() {
    return localStorage.getItem(USER_EMAIL_KEY);
}

/**
 * 设置用户邮箱
 */
export function setUserEmail(email) {
    localStorage.setItem(USER_EMAIL_KEY, email);
}

/**
 * 清除用户信息（退出登录）
 */
export function clearUser() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_ID_KEY);
    localStorage.removeItem(USER_EMAIL_KEY);
}

/**
 * 判断用户是否已登录
 */
export function isLoggedIn() {
    return !!getToken();
}

