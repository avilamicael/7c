import { useState, useEffect, useCallback, useMemo } from "react";
import { request, authHeaders } from "@/lib/api";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

const STATUS_CONFIG = {
  PENDENTE:                 { label: "Pendente",                className: "bg-amber-100 text-amber-700 border-amber-200" },
  RECEBIDA:                 { label: "Recebida",                className: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  VENCIDA:                  { label: "Vencida",                 className: "bg-red-100 text-red-700 border-red-200" },
  PARCIALMENTE_RECEBIDA:    { label: "Parcialmente Recebida",   className: "bg-blue-100 text-blue-700 border-blue-200" },
  CANCELADA:                { label: "Cancelada",               className: "bg-muted text-muted-foreground" },
  BAIXA_MANUAL:             { label: "Baixa Manual",            className: "bg-muted text-muted-foreground" },
};

const FORMA_PGTO = { PIX:"PIX", BOL:"Boleto", CAR:"Cartão", TED:"TED", CHQ:"Cheque", DIN:"Dinheiro", OUT:"Outro" };

function formatDate(date) {
  if (!date) return "—";
  return new Date(date + "T00:00:00").toLocaleDateString("pt-BR");
}

function formatCurrency(value) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value ?? 0);
}

function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] ?? { label: status, className: "" };
  return (
    <span className={cn("inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium", config.className)}>
      {config.label}
    </span>
  );
}

export function ContasReceberTable({ filters }) {
  const [contas, setContas] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchContas = useCallback(() => {
    setLoading(true);
    request("/financeiro/contas-receber/", { headers: authHeaders() })
      .then((res) => res.json())
      .then((data) => setContas(Array.isArray(data) ? data : (data?.results ?? [])))
      .catch(() => setContas([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchContas(); }, [fetchContas]);

  const filtered = useMemo(() => {
    let result = contas;
    if (filters.status && filters.status !== "todos") result = result.filter((c) => c.status === filters.status);
    if (filters.busca) {
      const q = filters.busca.toLowerCase();
      result = result.filter((c) =>
        c.cliente_nome?.toLowerCase().includes(q) ||
        c.fornecedor_nome?.toLowerCase().includes(q) ||
        c.numero_documento?.toLowerCase().includes(q)
      );
    }
    if (filters.dataInicio) result = result.filter((c) => c.data_competencia >= filters.dataInicio);
    if (filters.dataFim)    result = result.filter((c) => c.data_competencia <= filters.dataFim);
    return result;
  }, [contas, filters]);

  const total = useMemo(
    () => filtered.reduce((acc, c) => acc + (c.parcelas ?? []).reduce((s, p) => s + parseFloat(p.valor_bruto ?? 0), 0), 0),
    [filtered]
  );

  if (loading) return <div className="rounded-lg border p-8 text-center text-sm text-muted-foreground">Carregando...</div>;

  return (
    <div className="rounded-lg border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40">
            <TableHead className="font-semibold">Cliente / Fonte</TableHead>
            <TableHead className="font-semibold">Nº Documento</TableHead>
            <TableHead className="font-semibold">Descrição</TableHead>
            <TableHead className="font-semibold">Forma Pgto</TableHead>
            <TableHead className="font-semibold">Parcelas</TableHead>
            <TableHead className="font-semibold">Competência</TableHead>
            <TableHead className="font-semibold">Status</TableHead>
            <TableHead className="font-semibold text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-10 text-muted-foreground text-sm">Nenhuma conta encontrada.</TableCell>
            </TableRow>
          ) : filtered.map((conta) => (
            <TableRow key={conta.public_id} className="hover:bg-muted/30 transition-colors">
              <TableCell className="font-medium">{conta.cliente_nome ?? conta.fornecedor_nome ?? "—"}</TableCell>
              <TableCell className="text-muted-foreground text-sm">{conta.numero_documento || "—"}</TableCell>
              <TableCell className="text-muted-foreground text-sm max-w-[180px] truncate">{conta.descricao || "—"}</TableCell>
              <TableCell>{FORMA_PGTO[conta.forma_pagamento] ?? conta.forma_pagamento}</TableCell>
              <TableCell>{`${(conta.parcelas ?? []).filter((p) => p.status === "RECEBIDA").length}/${conta.total_parcelas}`}</TableCell>
              <TableCell>{formatDate(conta.data_competencia)}</TableCell>
              <TableCell><StatusBadge status={conta.status} /></TableCell>
              <TableCell>
                <div className="flex justify-end gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8"><Eye className="h-4 w-4 text-muted-foreground" /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8"><Pencil className="h-4 w-4 text-muted-foreground" /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8"><Trash2 className="h-4 w-4 text-red-400" /></Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/20 text-sm text-muted-foreground">
        <span>{filtered.length} registro(s) encontrado(s)</span>
        <span className="font-medium text-foreground">Total: {formatCurrency(total)}</span>
      </div>
    </div>
  );
}