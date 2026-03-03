const VIACEP_URL = "https://viacep.com.br/ws";

/**
 * Busca endereço pelo CEP via ViaCEP.
 * @param {string} cep - 8 dígitos numéricos
 * @returns {{ logradouro, bairro, cidade, uf }} dados do endereço
 * @throws {Error} se CEP inválido, não encontrado ou erro de rede
 */
export async function buscarCep(cep) {
  const soDigitos = cep.replace(/\D/g, "");

  if (soDigitos.length !== 8) {
    throw new Error("CEP deve conter 8 dígitos.");
  }

  const res = await fetch(`${VIACEP_URL}/${soDigitos}/json/`);

  if (!res.ok) {
    throw new Error("Erro ao consultar ViaCEP.");
  }

  const data = await res.json();

  if (data.erro) {
    throw new Error("CEP não encontrado.");
  }

  return {
    logradouro: data.logradouro || "",
    bairro: data.bairro || "",
    cidade: data.localidade || "",
    uf: data.uf || "",
  };
}