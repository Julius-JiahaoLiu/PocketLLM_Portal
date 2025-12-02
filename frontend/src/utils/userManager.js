// src/utils/userManager.js

const TOKEN_KEY = "pocketllm_token";
const USER_ID_KEY = "pocketllm_user_id";
const USER_EMAIL_KEY = "pocketllm_user_email";
const SESSION_MARKER_KEY = "pocketllm_session_active";

/**
 * Initialize session management
 * Clear auth data if this is a new browser session
 */
function initializeSession() {
    // Check if this is a new browser session
    const sessionActive = sessionStorage.getItem(SESSION_MARKER_KEY);
    
    if (!sessionActive) {
        // New browser session - clear any existing auth data
        clearUser();
        // Mark this session as active
        sessionStorage.setItem(SESSION_MARKER_KEY, "true");
    }
}

// Initialize on module load
initializeSession();

/**
 * 获取 JWT token
 */
export function getToken() {
    return sessionStorage.getItem(TOKEN_KEY);
}

/**
 * 设置 JWT token（登录后调用）
 */
export function setToken(token) {
    if (token) {
        sessionStorage.setItem(TOKEN_KEY, token);
    }
}

/**
 * 获取用户 ID
 */
export function getUserId() {
    return sessionStorage.getItem(USER_ID_KEY);
}

/**
 * 设置用户 ID（登录后调用）
 */
export function setUserId(userId) {
    if (userId) {
        sessionStorage.setItem(USER_ID_KEY, userId);
    }
}

/**
 * 获取用户邮箱（可选，用于显示）
 */
export function getUserEmail() {
    return sessionStorage.getItem(USER_EMAIL_KEY);
}

/**
 * 设置用户邮箱
 */
export function setUserEmail(email) {
    sessionStorage.setItem(USER_EMAIL_KEY, email);
}

/**
 * 清除用户信息（退出登录）
 */
export function clearUser() {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_ID_KEY);
    sessionStorage.removeItem(USER_EMAIL_KEY);
}

/**
 * 判断用户是否已登录
 */
export function isLoggedIn() {
    return !!getToken();
}

