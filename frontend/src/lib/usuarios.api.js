import { request, authHeaders } from "./api";

export const usuariosApi = {
  listar: () =>
    request("/usuarios/", { headers: authHeaders() }),

  criar: (data) =>
    request("/usuarios/criar/", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(data),
    }),

  toggleAtivo: (uuid) =>
    request(`/usuarios/${uuid}/desativar/`, {
      method: "PATCH",
      headers: authHeaders(),
    }),

  meuPerfil: async () => {
    const res = await request("/usuarios/me/", { headers: authHeaders() });
    if (!res.ok) throw await res.json();
    return res.json();
  },

  atualizarPerfil: async (data) => {
    const res = await request("/usuarios/me/", {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw await res.json();
    return res.json();
  },

  atualizarAvatar: async (file) => {
    const formData = new FormData();
    formData.append("avatar", file);
    const res = await request("/usuarios/me/avatar/", {
      method: "PATCH",
      headers: authHeaders(),
      body: formData,
    });
    if (!res.ok) throw await res.json();
    return res.json();
  },

  alterarSenha: async (data) => {
    const res = await request("/usuarios/me/senha/", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw await res.json();
    return res.json();
  },
};