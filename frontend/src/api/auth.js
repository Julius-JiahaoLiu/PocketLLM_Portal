// src/api/auth.js

import { apiPost } from "./client";

export async function register(email, password) {
    return apiPost("/auth/register", { email, password });
}

export async function login(email, password) {
    return apiPost("/auth/login", { email, password });
}
