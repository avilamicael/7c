import { request, authHeaders } from "./api";

export const empresasApi = {
  buscar: () =>
    request("/empresas/minha/", {
      headers: authHeaders(),
    }),

  editar: (data) =>
    request("/empresas/minha/", {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify(data),
    }),

  buscarPersonalizacao: () =>
    request("/empresas/minha/personalizacao/", {
      headers: authHeaders(),
    }),

  editarPersonalizacao: (data) =>
    request("/empresas/minha/personalizacao/", {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify(data),
    }),
};