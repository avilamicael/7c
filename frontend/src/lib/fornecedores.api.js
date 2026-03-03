import { request, authHeaders } from "./api";

const h = () => authHeaders();
const json = () => ({ ...h(), "Content-Type": "application/json" });

async function handle(res) {
  if (!res.ok) throw await res.json();
  const data = await res.json();
  return Array.isArray(data) ? data : (data?.results ?? data);
}

export const fornecedoresApi = {
  listar: (search = "") => {
    const qs = search ? `?search=${encodeURIComponent(search)}` : "";
    return handle(request(`/fornecedores/${qs}`, { headers: h() }));
  },

  detalhar: (publicId) =>
    handle(request(`/fornecedores/${publicId}/`, { headers: h() })),

  criar: (data) =>
    handle(
      request("/fornecedores/", {
        method: "POST",
        headers: json(),
        body: JSON.stringify(data),
      })
    ),

  editar: (publicId, data) =>
    handle(
      request(`/fornecedores/${publicId}/`, {
        method: "PATCH",
        headers: json(),
        body: JSON.stringify(data),
      })
    ),

  excluir: (publicId) =>
    request(`/fornecedores/${publicId}/`, {
      method: "DELETE",
      headers: h(),
    }),
};