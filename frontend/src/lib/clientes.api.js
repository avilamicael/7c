import { request, authHeaders } from "./api";

export const clientesApi = {
  listar: () =>
    request("/clientes/", {
      headers: authHeaders(),
    }),

  detalhar: (uuid) =>
    request(`/clientes/${uuid}/`, {
      headers: authHeaders(),
    }),

  criar: (data) =>
    request("/clientes/criar/", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(data),
    }),

  editar: (uuid, data) =>
    request(`/clientes/${uuid}/editar/`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify(data),
    }),

  inativar: (uuid) =>
    request(`/clientes/${uuid}/inativar/`, {
      method: "PATCH",
      headers: authHeaders(),
    }),

  // Documentos
  listarDocumentos: (uuid) =>
    request(`/clientes/${uuid}/documentos/`, {
      headers: authHeaders(),
    }),

  adicionarDocumento: (uuid, data) =>
    request(`/clientes/${uuid}/documentos/`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(data),
    }),

  // Telefones
  listarTelefones: (uuid) =>
    request(`/clientes/${uuid}/telefones/`, {
      headers: authHeaders(),
    }),

  adicionarTelefone: (uuid, data) =>
    request(`/clientes/${uuid}/telefones/`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(data),
    }),
};