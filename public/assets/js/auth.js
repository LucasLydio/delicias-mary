import { apiFetch } from "./api.js";

const STORAGE_KEY = "deliciasmary_auth";

export function getSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    if (!parsed.token) return null;
    return {
      token: String(parsed.token),
      user: parsed.user ?? null,
    };
  } catch {
    return null;
  }
}

export function getToken() {
  return getSession()?.token || null;
}

export function setSession({ token, user }) {
  if (!token) throw new Error("Missing token.");
  const payload = { token: String(token), user: user ?? null };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  return payload;
}

export function clearSession() {
  localStorage.removeItem(STORAGE_KEY);
}

export async function login({ email, password }) {
  const payload = await apiFetch("/.netlify/functions/auth", {
    method: "POST",
    body: { action: "login", email, password },
  });

  const data = payload && typeof payload === "object" ? payload.data : null;
  if (!data || !data.token) throw new Error("Login failed.");
  setSession({ token: data.token, user: data.user });
  return data;
}

export async function register({ name, email, phone, password }) {
  const payload = await apiFetch("/.netlify/functions/auth", {
    method: "POST",
    body: { action: "register", name, email, phone, password },
  });

  const data = payload && typeof payload === "object" ? payload.data : null;
  if (!data || !data.token) throw new Error("Registration failed.");
  setSession({ token: data.token, user: data.user });
  return data;
}
