import { request, authHeaders } from "./api";

const h    = () => authHeaders();
const json = () => ({ ...h(), "Content-Type": "application/json" });

async function handle(resPromise) {
  const res = await resPromise;
  if (!res.ok) throw await res.json();
  if (res.status === 204) return null;
  return res.json();
}

export const tarefasApi = {
  listar: (params = {}) => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v !== "" && v !== undefined))
    ).toString();
    return handle(request(`/tarefas/${qs ? `?${qs}` : ""}`, { headers: h() }));
  },

  criar: (data) =>
    handle(request("/tarefas/", { method: "POST", headers: json(), body: JSON.stringify(data) })),

  editar: (id, data) =>
    handle(request(`/tarefas/${id}/`, { method: "PATCH", headers: json(), body: JSON.stringify(data) })),

  excluir: (id) =>
    request(`/tarefas/${id}/`, { method: "DELETE", headers: h() }),

  concluir: (id) =>
    handle(request(`/tarefas/${id}/concluir/`, { method: "POST", headers: json() })),

  cancelar: (id) =>
    handle(request(`/tarefas/${id}/cancelar/`, { method: "POST", headers: json() })),

  reabrir: (id) =>
    handle(request(`/tarefas/${id}/reabrir/`, { method: "POST", headers: json() })),
};
