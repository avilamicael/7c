// src/lib/api.js
const BASE_URL = "/api";

async function refreshAccessToken() {
  const refresh = localStorage.getItem("refresh");
  if (!refresh) return false;

  const res = await fetch(`${BASE_URL}/auth/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh }),
  });

  if (!res.ok) {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    return false;
  }

  const data = await res.json();
  localStorage.setItem("access", data.access);
  if (data.refresh) localStorage.setItem("refresh", data.refresh);
  return true;
}

export async function request(endpoint, options = {}) {
  const isFormData = options.body instanceof FormData;
  const headers = isFormData
    ? { ...options.headers }
    : { "Content-Type": "application/json", ...options.headers };

  let res = await fetch(`${BASE_URL}${endpoint}`, { ...options, headers });

  if (res.status === 401) {
    const renovado = await refreshAccessToken();
    if (renovado) {
      const newHeaders = {
        ...headers,
        Authorization: `Bearer ${localStorage.getItem("access")}`,
      };
      res = await fetch(`${BASE_URL}${endpoint}`, { ...options, headers: newHeaders });
    }
  }

  return res;
}

export function authHeaders() {
  return { Authorization: `Bearer ${localStorage.getItem("access")}` };
}