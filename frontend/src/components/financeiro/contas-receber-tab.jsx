import { useState, useMemo, useEffect, useCallback } from "react";
import { request, authHeaders } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { KPICards } from "@/components/kpi-cards";
import { DetalhesContaReceberModal } from "@/components/financeiro/detalhes-conta-receber-modal";
import { EditContaReceberModal } from "@/components/financeiro/edit-conta-receber-modal";
import { Search, Plus, Eye, Pencil, Trash2, DollarSign, AlertTriangle, CheckCircle, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

const STATUS_OPTIONS = ["Todos", "PENDENTE", "RECEBIDA", "VENCIDA", "PARCIALMENTE_RECEBIDA", "CANCELADA", "BAIXA_MANUAL"];
const STATUS_LABEL = {
  PENDENTE: "Pendente", RECEBIDA: "Recebida", VENCIDA: "Vencida",
  PARCIALMENTE_RECEBIDA: "Parcialmente Paga", CANCELADA: "Cancelada", BAIXA_MANUAL: "Baixa Manual",
};
const STATUS_COLOR = {
  PENDENTE: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900",
  RECEBIDA: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900",
  VENCIDA: "bg-red-50 text-red-600 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900",
  PARCIALMENTE_RECEBIDA: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900",
  CANCELADA: "bg-muted text-muted-foreground border-border",
  BAIXA_MANUAL: "bg-muted text-muted-foreground border-border",
};
const FORMA_PGTO = { PIX: "PIX", BOL: "Boleto", CAR: "Cartão", TED: "TED", CHQ: "Cheque", DIN: "Dinheiro", OUT: "Outro" };

function formatDate(date) {
  if (!date) return "—";
  return new Date(date + "T00:00:00").toLocaleDateString("pt-BR");
}
function formatCurrency(value) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value ?? 0);
}
function StatusBadge({ status }) {
  return (
    <span className={cn(
      "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium whitespace-nowrap",
      STATUS_COLOR[status] ?? "bg-muted text-muted-foreground border-border"
    )}>
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}

function calcKPIs(contas) {
  const hoje = new Date();
  const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  let totalPendente = 0, totalVencido = 0, totalRecebidoNoMes = 0;
  for (const c of contas) {
    for (const p of c.parcelas ?? []) {
      const bruto = parseFloat(p.valor_bruto ?? 0);
      const pago = parseFloat(p.valor_pago ?? 0);
      const saldo = parseFloat(p.saldo ?? bruto - pago);
      if (p.status === "PENDENTE" || p.status === "PARCIALMENTE_RECEBIDA") {
        totalPendente += saldo;
        if (new Date(p.data_vencimento) < hoje) totalVencido += saldo;
      }
      if (p.status === "RECEBIDA" && p.data_pagamento && new Date(p.data_pagamento) >= inicioMes) {
        totalRecebidoNoMes += pago;
      }
    }
  }
  return { totalPendente, totalVencido, totalRecebidoNoMes, totalContas: contas.length };
}

export function ContasReceberTab() {
  const [contas, setContas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [detalheConta, setDetalheConta] = useState(null);
  const [editConta, setEditConta] = useState(null);
  const [showNew, setShowNew] = useState(false);

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
    let r = contas;
    if (statusFilter !== "Todos") r = r.filter((c) => c.status === statusFilter);
    if (search) {
      const q = search.toLowerCase();
      r = r.filter((c) =>
        c.cliente_nome?.toLowerCase().includes(q) ||
        c.fornecedor_nome?.toLowerCase().includes(q) ||
        c.numero_documento?.toLowerCase().includes(q)
      );
    }
    if (dateFrom) r = r.filter((c) => c.data_competencia >= dateFrom);
    if (dateTo) r = r.filter((c) => c.data_competencia <= dateTo);
    return r;
  }, [contas, search, statusFilter, dateFrom, dateTo]);

  const kpis = useMemo(() => calcKPIs(contas), [contas]);
  const total = useMemo(() => filtered.reduce((acc, c) => acc + (c.parcelas ?? []).reduce((s, p) => s + parseFloat(p.valor_bruto ?? 0), 0), 0), [filtered]);

  return (
    <div className="flex flex-col gap-4">
      <KPICards cards={[
        { label: "Total Pendente", value: formatCurrency(kpis.totalPendente), icon: DollarSign, iconColor: "text-amber-500", iconBg: "bg-amber-50 dark:bg-amber-950/40" },
        { label: "Total Vencido", value: formatCurrency(kpis.totalVencido), icon: AlertTriangle, iconColor: "text-red-500", iconBg: "bg-red-50 dark:bg-red-950/40" },
        { label: "Total Recebido", value: formatCurrency(kpis.totalRecebidoNoMes), icon: CheckCircle, iconColor: "text-emerald-500", iconBg: "bg-emerald-50 dark:bg-emerald-950/40" },
        { label: "Total de Contas", value: String(kpis.totalContas), icon: FileText, iconColor: "text-blue-500", iconBg: "bg-blue-50 dark:bg-blue-950/40" },
      ]} />

      {/* Filtros */}
      <div className="rounded-lg border bg-card px-4 py-3">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-1 flex-col gap-1 min-w-[180px]">
            <label className="text-xs text-muted-foreground">Buscar</label>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Cliente, fornecedor ou Nº documento..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-9 text-sm"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1 w-48">
            <label className="text-xs text-muted-foreground">Status</label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-9 text-sm w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s} value={s}>{s === "Todos" ? "Todos" : STATUS_LABEL[s]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">De</label>
            <DatePicker value={dateFrom} onChange={setDateFrom} placeholder="dd/mm/aaaa" />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">Até</label>
            <DatePicker value={dateTo} onChange={setDateTo} placeholder="dd/mm/aaaa" />
          </div>

          <Button onClick={() => setShowNew(true)} className="h-9 gap-1.5 px-4 self-end">
            <Plus className="size-3.5" />Nova Conta
          </Button>
        </div>
      </div>

      {/* Tabela */}
      <div className="rounded-lg border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-b">
              <TableHead className="text-xs font-semibold text-foreground h-10">Cliente / Fonte</TableHead>
              <TableHead className="text-xs font-semibold text-foreground h-10 hidden md:table-cell">Nº Documento</TableHead>
              <TableHead className="text-xs font-semibold text-foreground h-10 hidden lg:table-cell">Descrição</TableHead>
              <TableHead className="text-xs font-semibold text-foreground h-10 hidden lg:table-cell">Forma Pgto</TableHead>
              <TableHead className="text-xs font-semibold text-foreground h-10 hidden md:table-cell">Parcelas</TableHead>
              <TableHead className="text-xs font-semibold text-foreground h-10 hidden md:table-cell">Competência</TableHead>
              <TableHead className="text-xs font-semibold text-foreground h-10">Status</TableHead>
              <TableHead className="text-xs font-semibold text-foreground h-10 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={8} className="h-24 text-center text-sm text-muted-foreground">Carregando...</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={8} className="h-24 text-center text-sm text-muted-foreground">Nenhuma conta encontrada.</TableCell></TableRow>
            ) : filtered.map((conta) => (
              <TableRow key={conta.public_id} className="hover:bg-muted/30 transition-colors h-14">
                <TableCell className="font-semibold text-sm py-3">{conta.cliente_nome ?? conta.fornecedor_nome ?? "—"}</TableCell>
                <TableCell className="hidden md:table-cell font-mono text-xs text-muted-foreground py-3">{conta.numero_documento || "—"}</TableCell>
                <TableCell className="hidden lg:table-cell max-w-48 truncate text-sm text-muted-foreground py-3">{conta.descricao || "—"}</TableCell>
                <TableCell className="hidden lg:table-cell text-sm py-3">{FORMA_PGTO[conta.forma_pagamento] ?? conta.forma_pagamento}</TableCell>
                <TableCell className="hidden md:table-cell font-mono text-sm py-3">
                  {`${(conta.parcelas ?? []).filter((p) => p.status === "RECEBIDA").length}/${conta.total_parcelas}`}
                </TableCell>
                <TableCell className="hidden md:table-cell text-sm py-3">{formatDate(conta.data_competencia)}</TableCell>
                <TableCell className="py-3"><StatusBadge status={conta.status} /></TableCell>
                <TableCell className="py-3">
                  <div className="flex items-center justify-end gap-0.5">
                    <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-foreground" onClick={() => setDetalheConta(conta)}>
                      <Eye className="size-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-foreground" onClick={() => setEditConta(conta)}>
                      <Pencil className="size-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-destructive">
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {filtered.length > 0 && (
          <div className="flex items-center justify-between border-t px-4 py-2.5 text-xs text-muted-foreground">
            <span>{filtered.length} registro(s) encontrado(s)</span>
            <span className="font-sans font-semibold text-foreground text-sm">Total: {formatCurrency(total)}</span>
          </div>
        )}
      </div>

      <DetalhesContaReceberModal conta={detalheConta} onClose={() => setDetalheConta(null)} />
      <EditContaReceberModal conta={editConta} onClose={() => setEditConta(null)} onSuccess={fetchContas} />
      <EditContaReceberModal conta={null} isNew open={showNew} onClose={() => setShowNew(false)} onSuccess={fetchContas} />
    </div>
  );
}