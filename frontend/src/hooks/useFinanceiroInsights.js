import { useState, useEffect } from "react";
import { request, authHeaders } from "@/lib/api";

export function useFinanceiroInsights(tipo) {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const endpoint = tipo === "pagar"
      ? "/financeiro/contas-pagar/"
      : "/financeiro/contas-receber/";

    request(endpoint, { headers: authHeaders() })
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        const contas = Array.isArray(data) ? data : (data?.results ?? []);

        const hoje = new Date();
        const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
        const statusPago = tipo === "pagar" ? "PAGA" : "RECEBIDA";
        const statusParcial = tipo === "pagar" ? "PARCIALMENTE_PAGA" : "PARCIALMENTE_RECEBIDA";

        let total_pendente = 0;
        let total_vencido = 0;
        let total_pago_mes = 0;

        for (const conta of contas) {
          for (const p of conta.parcelas ?? []) {
            const bruto = parseFloat(p.valor_bruto ?? 0);
            const pago  = parseFloat(p.valor_pago ?? 0);
            const saldo = parseFloat(p.saldo ?? bruto - pago);
            const vencimento = new Date(p.data_vencimento);
            const pagamento  = p.data_pagamento ? new Date(p.data_pagamento) : null;

            if (p.status === "PENDENTE" || p.status === statusParcial) {
              total_pendente += saldo;
              if (vencimento < hoje) total_vencido += saldo;
            }
            if (p.status === statusPago && pagamento && pagamento >= inicioMes) {
              total_pago_mes += pago;
            }
          }
        }

        setInsights({
          total_pendente,
          total_vencido,
          [tipo === "pagar" ? "total_pago_mes" : "total_recebido_mes"]: total_pago_mes,
          total_contas: contas.length,
        });
      })
      .catch(() => { if (!cancelled) setInsights(null); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [tipo]);

  return { insights, loading };
}