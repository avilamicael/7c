import { request, authHeaders } from "./api";

export const usuariosApi = {
  listar: () =>
    request("/auth/", {
      headers: authHeaders(),
    }),

  criar: (data) =>
    request("/auth/criar/", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(data),
    }),

  toggleAtivo: (uuid) =>
    request(`/auth/${uuid}/desativar/`, {
      method: "PATCH",
      headers: authHeaders(),
    }),
};