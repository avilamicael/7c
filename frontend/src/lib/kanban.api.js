import { request, authHeaders } from "./api";

const h    = () => authHeaders();
const json = () => ({ ...h(), "Content-Type": "application/json" });

async function handle(resPromise) {
  const res = await resPromise;
  if (!res.ok) throw await res.json();
  if (res.status === 204) return null;
  return res.json();
}

export const kanbanApi = {
  boards: {
    listar: () =>
      handle(request("/kanban/boards/", { headers: h() })),

    buscar: (id) =>
      handle(request(`/kanban/boards/${id}/`, { headers: h() })),

    criar: (data) =>
      handle(request("/kanban/boards/", { method: "POST", headers: json(), body: JSON.stringify(data) })),

    editar: (id, data) =>
      handle(request(`/kanban/boards/${id}/`, { method: "PATCH", headers: json(), body: JSON.stringify(data) })),

    toggleAtivo: (id, ativo) =>
      handle(request(`/kanban/boards/${id}/`, { method: "PATCH", headers: json(), body: JSON.stringify({ ativo }) })),
  },

  colunas: {
    listar: (boardId) =>
      handle(request(`/kanban/boards/${boardId}/colunas/`, { headers: h() })),

    criar: (boardId, data) =>
      handle(request(`/kanban/boards/${boardId}/colunas/`, { method: "POST", headers: json(), body: JSON.stringify(data) })),

    editar: (boardId, colunaId, data) =>
      handle(request(`/kanban/boards/${boardId}/colunas/${colunaId}/`, { method: "PATCH", headers: json(), body: JSON.stringify(data) })),

    excluir: (boardId, colunaId) =>
      handle(request(`/kanban/boards/${boardId}/colunas/${colunaId}/`, { method: "DELETE", headers: h() })),
  },

  cards: {
    criar: (data) =>
      handle(request("/kanban/cards/", { method: "POST", headers: json(), body: JSON.stringify(data) })),

    editar: (id, data) =>
      handle(request(`/kanban/cards/${id}/`, { method: "PATCH", headers: json(), body: JSON.stringify(data) })),

    mover: (id, data) =>
      handle(request(`/kanban/cards/${id}/mover/`, { method: "POST", headers: json(), body: JSON.stringify(data) })),

    arquivar: (id) =>
      handle(request(`/kanban/cards/${id}/arquivar/`, { method: "POST", headers: json() })),

    reordenar: (items) =>
      handle(request("/kanban/cards/reordenar/", { method: "POST", headers: json(), body: JSON.stringify(items) })),
  },
};
