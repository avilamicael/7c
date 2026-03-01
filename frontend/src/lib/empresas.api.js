import { request, authHeaders } from "./api";

export const empresasApi = {
  buscar: async () => {
    const res = await request("/empresas/minha/", { headers: authHeaders() });
    if (!res.ok) throw await res.json();
    return res.json();
  },

  editar: async (data) => {
    const res = await request("/empresas/minha/", {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw await res.json();
    return res.json();
  },

  buscarPersonalizacao: async () => {
    const res = await request("/empresas/minha/personalizacao/", { headers: authHeaders() });
    if (!res.ok) throw await res.json();
    return res.json();
  },

  editarPersonalizacao: async (data) => {
    const res = await request("/empresas/minha/personalizacao/", {
      method: "PATCH",
      headers: authHeaders(),
      body: data instanceof FormData ? data : JSON.stringify(data),
    });
    if (!res.ok) throw await res.json();
    return res.json();
  },
};