import { request } from "./api";

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
      headers: { Authorization: `Bearer ${localStorage.getItem("access")}` },
      body: JSON.stringify({ refresh: refreshToken }),
    }),
};