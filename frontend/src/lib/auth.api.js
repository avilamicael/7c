import { request, authHeaders } from "./api";

export const authApi = {
  login: (email, password) =>
    request("/auth/login/", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  refresh: (refreshToken) =>
    request("/auth/refresh/", {
      method: "POST",
      body: JSON.stringify({ refresh: refreshToken }),
    }),

  logout: (refreshToken) =>
    request("/auth/logout/", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ refresh: refreshToken }),
    }),
};