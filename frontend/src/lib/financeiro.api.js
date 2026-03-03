import { request, authHeaders } from "./api";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const h = () => authHeaders();
const json = (extra = {}) => ({ ...h(), "Content-Type": "application/json", ...extra });

async function handle(resPromise) {
  const res = await resPromise;
  if (!res.ok) throw await res.json();
  // DELETE retorna 204 sem body
  if (res.status === 204) return null;
  return res.json();
}

// ─── Contas a Pagar ───────────────────────────────────────────────────────────
export const contasPagarApi = {
  listar: () =>
    handle(request("/financeiro/contas-pagar/", { headers: h() })),

  detalhar: (publicId) =>
    handle(request(`/financeiro/contas-pagar/${publicId}/`, { headers: h() })),

  criar: (data) =>
    handle(
      request("/financeiro/contas-pagar/", {
        method: "POST",
        headers: json(),
        body: JSON.stringify(data),
      })
    ),

  editar: (publicId, data) =>
    handle(
      request(`/financeiro/contas-pagar/${publicId}/`, {
        method: "PATCH",
        headers: json(),
        body: JSON.stringify(data),
      })
    ),

  excluir: (publicId) =>
    request(`/financeiro/contas-pagar/${publicId}/`, {
      method: "DELETE",
      headers: h(),
    }),

  baixa: (publicId, data) =>
    handle(
      request(`/financeiro/contas-pagar/${publicId}/baixa/`, {
        method: "POST",
        headers: json(),
        body: JSON.stringify(data),
      })
    ),
};

// ─── Parcelas a Pagar ─────────────────────────────────────────────────────────
export const parcelasPagarApi = {
  detalhar: (id) =>
    handle(request(`/financeiro/parcelas-pagar/${id}/`, { headers: h() })),

  registrarPagamento: (id, data) =>
    handle(
      request(`/financeiro/parcelas-pagar/${id}/registrar-pagamento/`, {
        method: "POST",
        headers: json(),
        body: JSON.stringify(data),
      })
    ),
};

// ─── Contas a Receber ─────────────────────────────────────────────────────────
export const contasReceberApi = {
  listar: () =>
    handle(request("/financeiro/contas-receber/", { headers: h() })),

  detalhar: (publicId) =>
    handle(request(`/financeiro/contas-receber/${publicId}/`, { headers: h() })),

  criar: (data) =>
    handle(
      request("/financeiro/contas-receber/", {
        method: "POST",
        headers: json(),
        body: JSON.stringify(data),
      })
    ),

  editar: (publicId, data) =>
    handle(
      request(`/financeiro/contas-receber/${publicId}/`, {
        method: "PATCH",
        headers: json(),
        body: JSON.stringify(data),
      })
    ),

  excluir: (publicId) =>
    request(`/financeiro/contas-receber/${publicId}/`, {
      method: "DELETE",
      headers: h(),
    }),

  baixa: (publicId, data) =>
    handle(
      request(`/financeiro/contas-receber/${publicId}/baixa/`, {
        method: "POST",
        headers: json(),
        body: JSON.stringify(data),
      })
    ),
};

// ─── Parcelas a Receber ───────────────────────────────────────────────────────
export const parcelasReceberApi = {
  detalhar: (id) =>
    handle(request(`/financeiro/parcelas-receber/${id}/`, { headers: h() })),

  registrarRecebimento: (id, data) =>
    handle(
      request(`/financeiro/parcelas-receber/${id}/registrar-recebimento/`, {
        method: "POST",
        headers: json(),
        body: JSON.stringify(data),
      })
    ),
};

// ─── Categorias ───────────────────────────────────────────────────────────────
export const categoriasApi = {
  listar: () =>
    handle(request("/financeiro/categorias/", { headers: h() })),

  criar: (data) =>
    handle(
      request("/financeiro/categorias/", {
        method: "POST",
        headers: json(),
        body: JSON.stringify(data),
      })
    ),

  editar: (id, data) =>
    handle(
      request(`/financeiro/categorias/${id}/`, {
        method: "PATCH",
        headers: json(),
        body: JSON.stringify(data),
      })
    ),

  excluir: (id) =>
    request(`/financeiro/categorias/${id}/`, {
      method: "DELETE",
      headers: h(),
    }),
};

// ─── Contas Bancárias ─────────────────────────────────────────────────────────
export const contasBancariasApi = {
  listar: () =>
    handle(request("/financeiro/contas-bancarias/", { headers: h() })),

  criar: (data) =>
    handle(
      request("/financeiro/contas-bancarias/", {
        method: "POST",
        headers: json(),
        body: JSON.stringify(data),
      })
    ),

  editar: (id, data) =>
    handle(
      request(`/financeiro/contas-bancarias/${id}/`, {
        method: "PATCH",
        headers: json(),
        body: JSON.stringify(data),
      })
    ),

  excluir: (id) =>
    request(`/financeiro/contas-bancarias/${id}/`, {
      method: "DELETE",
      headers: h(),
    }),
};