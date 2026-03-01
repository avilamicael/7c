const BASE_URL = "/api";

export async function request(endpoint, options = {}) {
  const isFormData = options.body instanceof FormData;

  const headers = isFormData
    ? { ...options.headers }
    : { "Content-Type": "application/json", ...options.headers };

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  return res;
}

export function authHeaders() {
  return { Authorization: `Bearer ${localStorage.getItem("access")}` };
}