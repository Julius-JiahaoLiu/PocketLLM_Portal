// src/utils/userManager.js

const USER_ID_KEY = "pocketllm_user_id";
const USER_EMAIL_KEY = "pocketllm_user_email";

/**
 * 获取或创建用户 ID
 * 首次访问时生成 UUID，之后从 localStorage 读取
 */
export function getUserId() {
    let userId = localStorage.getItem(USER_ID_KEY);
    
    if (!userId) {
        // 生成 UUID v4
        userId = generateUUID();
        localStorage.setItem(USER_ID_KEY, userId);
    }
    
    return userId;
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
    localStorage.removeItem(USER_ID_KEY);
    localStorage.removeItem(USER_EMAIL_KEY);
}

/**
 * 生成 UUID v4
 * https://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript
 */
function generateUUID() {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
        const r = (Math.random() * 16) | 0;
        const v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}
