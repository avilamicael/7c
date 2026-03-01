const BASE_URL = "/api";

export async function request(endpoint, options = {}) {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });
  return res;
}

export function authHeaders() {
  return { Authorization: `Bearer ${localStorage.getItem("access")}` };
}