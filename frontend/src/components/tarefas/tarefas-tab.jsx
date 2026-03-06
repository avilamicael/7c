import { useState, useMemo, useEffect, useCallback } from "react";
import { tarefasApi } from "@/lib/tarefas.api";
import { KPICards } from "@/components/kpi-cards";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { EditTarefaModal } from "./edit-tarefa-modal";
import { DetalhesTarefaModal } from "./detalhes-tarefa-modal";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Search, Plus, CheckCircle2, Clock, AlertTriangle, ListChecks,
  Eye, Pencil, CheckCheck, RotateCcw, XCircle, LayoutGrid,
} from "lucide-react";

// ─── Constantes ────────────────────────────────────────────────────────────────

const STATUS_OPTIONS = [
  { value: "", label: "Todos os status" },
  { value: "PENDENTE",     label: "Pendente" },
  { value: "EM_PROGRESSO", label: "Em Progresso" },
  { value: "CONCLUIDA",    label: "Concluída" },
  { value: "CANCELADA",    label: "Cancelada" },
];

const PRIORIDADE_OPTIONS = [
  { value: "", label: "Todas as prioridades" },
  { value: "URGENTE", label: "Urgente" },
  { value: "ALTA",    label: "Alta" },
  { value: "MEDIA",   label: "Média" },
  { value: "BAIXA",   label: "Baixa" },
];

const STATUS_CONFIG = {
  PENDENTE:     { label: "Pendente",     color: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900" },
  EM_PROGRESSO: { label: "Em Progresso", color: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900" },
  CONCLUIDA:    { label: "Concluída",    color: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900" },
  CANCELADA:    { label: "Cancelada",    color: "bg-muted text-muted-foreground border-border" },
};

const PRIORIDADE_CONFIG = {
  URGENTE: { label: "Urgente", color: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900",       bar: "bg-red-500" },
  ALTA:    { label: "Alta",    color: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-400 dark:border-orange-900", bar: "bg-orange-500" },
  MEDIA:   { label: "Média",   color: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-400 dark:border-sky-900",         bar: "bg-sky-500" },
  BAIXA:   { label: "Baixa",   color: "bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-950/40 dark:text-slate-400 dark:border-slate-700",      bar: "bg-slate-400" },
};

// ─── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(date) {
  if (!date) return "—";
  return new Date(date + "T00:00:00").toLocaleDateString("pt-BR");
}

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, color: "bg-muted text-muted-foreground border-border" };
  return (
    <span className={cn("inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium whitespace-nowrap", cfg.color)}>
      {cfg.label}
    </span>
  );
}

function PrioridadeBadge({ prioridade }) {
  const cfg = PRIORIDADE_CONFIG[prioridade] ?? { label: prioridade, color: "bg-muted text-muted-foreground border-border" };
  return (
    <span className={cn("inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium whitespace-nowrap", cfg.color)}>
      {cfg.label}
    </span>
  );
}

function PrioridadeBar({ prioridade }) {
  const cfg = PRIORIDADE_CONFIG[prioridade];
  if (!cfg) return null;
  return <div className={cn("w-1 self-stretch rounded-full shrink-0", cfg.bar)} />;
}

// ─── Componente principal ──────────────────────────────────────────────────────

export function TarefasTab({ isAdmin, usuario }) {
  const [tarefas, setTarefas]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");
  const [statusFilter, setStatus] = useState("");
  const [prioFilter, setPrio]     = useState("");
  const [minhas, setMinhas]       = useState(false);
  const [detalhes, setDetalhes]   = useState(null);
  const [editando, setEditando]   = useState(null);
  const [showNew, setShowNew]     = useState(false);

  const fetchTarefas = useCallback(async () => {
    setLoading(true);
    try {
      const data = await tarefasApi.listar();
      setTarefas(Array.isArray(data) ? data : (data?.results ?? []));
    } catch {
      toast.error("Erro ao carregar tarefas.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTarefas(); }, [fetchTarefas]);

  // ─── Filtros client-side ───────────────────────────────────────────────────

  const filtered = useMemo(() => {
    let r = tarefas;

    if (statusFilter) r = r.filter((t) => t.status === statusFilter);
    if (prioFilter)   r = r.filter((t) => t.prioridade === prioFilter);

    if (minhas && usuario?.public_id) {
      r = r.filter((t) => t.atribuido_a_public_id === usuario.public_id);
    }

    if (search) {
      const q = search.toLowerCase();
      r = r.filter((t) =>
        t.titulo?.toLowerCase().includes(q) ||
        t.descricao?.toLowerCase().includes(q) ||
        t.atribuido_a_nome?.toLowerCase().includes(q)
      );
    }

    return r;
  }, [tarefas, statusFilter, prioFilter, minhas, search, usuario]);

  // ─── KPIs ──────────────────────────────────────────────────────────────────

  const kpis = useMemo(() => {
    const hoje = new Date().toISOString().split("T")[0];
    return {
      total:      tarefas.length,
      pendentes:  tarefas.filter((t) => t.status === "PENDENTE" || t.status === "EM_PROGRESSO").length,
      vencidas:   tarefas.filter((t) => t.vencida).length,
      concluidas: tarefas.filter((t) => t.status === "CONCLUIDA").length,
    };
  }, [tarefas]);

  const kpiCards = [
    { label: "Total de Tarefas", value: String(kpis.total),      icon: ListChecks,    iconColor: "text-blue-500",    iconBg: "bg-blue-50 dark:bg-blue-950/40" },
    { label: "Em Aberto",        value: String(kpis.pendentes),   icon: Clock,         iconColor: "text-amber-500",   iconBg: "bg-amber-50 dark:bg-amber-950/40" },
    { label: "Vencidas",         value: String(kpis.vencidas),    icon: AlertTriangle, iconColor: "text-red-500",     iconBg: "bg-red-50 dark:bg-red-950/40" },
    { label: "Concluídas",       value: String(kpis.concluidas),  icon: CheckCircle2,  iconColor: "text-emerald-500", iconBg: "bg-emerald-50 dark:bg-emerald-950/40" },
  ];

  // ─── Ações ─────────────────────────────────────────────────────────────────

  async function handleConcluir(tarefa) {
    try {
      await tarefasApi.concluir(tarefa.public_id);
      toast.success("Tarefa concluída.");
      fetchTarefas();
    } catch (e) {
      toast.error(e?.detail ?? "Erro ao concluir tarefa.");
    }
  }

  async function handleReabrir(tarefa) {
    try {
      await tarefasApi.reabrir(tarefa.public_id);
      toast.success("Tarefa reaberta.");
      fetchTarefas();
    } catch (e) {
      toast.error(e?.detail ?? "Erro ao reabrir tarefa.");
    }
  }

  async function handleCancelar(tarefa) {
    try {
      await tarefasApi.cancelar(tarefa.public_id);
      toast.success("Tarefa cancelada.");
      fetchTarefas();
    } catch (e) {
      toast.error(e?.detail ?? "Erro ao cancelar tarefa.");
    }
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-6">
      <KPICards cards={kpiCards} />

      {/* Filtros */}
      <div className="rounded-lg border bg-card px-4 py-3">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-1 flex-col gap-1 min-w-[180px]">
            <label className="text-xs text-muted-foreground">Buscar</label>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Título, descrição ou responsável..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-9 text-sm"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1 w-44">
            <label className="text-xs text-muted-foreground">Status</label>
            <Select value={statusFilter || "__all__"} onValueChange={(v) => setStatus(v === "__all__" ? "" : v)}>
              <SelectTrigger className="h-9 text-sm w-full"><SelectValue placeholder="Todos os status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Todos os status</SelectItem>
                {STATUS_OPTIONS.filter((o) => o.value).map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1 w-44">
            <label className="text-xs text-muted-foreground">Prioridade</label>
            <Select value={prioFilter || "__all__"} onValueChange={(v) => setPrio(v === "__all__" ? "" : v)}>
              <SelectTrigger className="h-9 text-sm w-full"><SelectValue placeholder="Todas as prioridades" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Todas as prioridades</SelectItem>
                {PRIORIDADE_OPTIONS.filter((o) => o.value).map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1 self-end">
            <Button
              variant={minhas ? "default" : "outline"}
              size="sm"
              className="h-9 gap-1.5 px-3"
              onClick={() => setMinhas((v) => !v)}
            >
              <CheckCircle2 className="size-3.5" />
              Minhas tarefas
            </Button>
          </div>

          <Button onClick={() => setShowNew(true)} className="h-9 gap-1.5 px-4 self-end">
            <Plus className="size-3.5" />
            Nova Tarefa
          </Button>
        </div>
      </div>

      {/* Tabela */}
      <div className="rounded-lg border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-b">
              <TableHead className="text-xs font-semibold text-foreground h-10 w-1.5" />
              <TableHead className="text-xs font-semibold text-foreground h-10">Tarefa</TableHead>
              <TableHead className="text-xs font-semibold text-foreground h-10 hidden md:table-cell">Prioridade</TableHead>
              <TableHead className="text-xs font-semibold text-foreground h-10">Status</TableHead>
              <TableHead className="text-xs font-semibold text-foreground h-10 hidden lg:table-cell">Responsável</TableHead>
              <TableHead className="text-xs font-semibold text-foreground h-10 hidden md:table-cell">Vencimento</TableHead>
              <TableHead className="text-xs font-semibold text-foreground h-10 hidden xl:table-cell text-center">Kanban</TableHead>
              <TableHead className="text-xs font-semibold text-foreground h-10 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center text-sm text-muted-foreground">Carregando...</TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center text-sm text-muted-foreground">Nenhuma tarefa encontrada.</TableCell>
              </TableRow>
            ) : filtered.map((tarefa) => (
              <TableRow
                key={tarefa.public_id}
                className={cn(
                  "transition-colors h-14",
                  tarefa.vencida && tarefa.status !== "CONCLUIDA" && tarefa.status !== "CANCELADA"
                    ? "hover:bg-red-50/50 dark:hover:bg-red-950/20"
                    : "hover:bg-muted/30"
                )}
              >
                {/* Barra de prioridade */}
                <TableCell className="py-0 px-2">
                  <PrioridadeBar prioridade={tarefa.prioridade} />
                </TableCell>

                {/* Título + descrição */}
                <TableCell className="py-3 max-w-xs">
                  <div className="flex flex-col gap-0.5">
                    <span className={cn(
                      "font-medium text-sm leading-tight",
                      tarefa.status === "CONCLUIDA" && "line-through text-muted-foreground"
                    )}>
                      {tarefa.titulo}
                    </span>
                    {tarefa.descricao && (
                      <span className="text-xs text-muted-foreground truncate max-w-64">{tarefa.descricao}</span>
                    )}
                  </div>
                </TableCell>

                {/* Prioridade */}
                <TableCell className="hidden md:table-cell py-3">
                  <PrioridadeBadge prioridade={tarefa.prioridade} />
                </TableCell>

                {/* Status */}
                <TableCell className="py-3">
                  <StatusBadge status={tarefa.status} />
                </TableCell>

                {/* Responsável */}
                <TableCell className="hidden lg:table-cell py-3 text-sm text-muted-foreground">
                  {tarefa.atribuido_a_nome ?? "—"}
                </TableCell>

                {/* Vencimento */}
                <TableCell className="hidden md:table-cell py-3">
                  <span className={cn(
                    "text-sm",
                    tarefa.vencida && tarefa.status !== "CONCLUIDA" && tarefa.status !== "CANCELADA"
                      ? "text-red-600 dark:text-red-400 font-medium"
                      : "text-muted-foreground"
                  )}>
                    {formatDate(tarefa.data_vencimento)}
                    {tarefa.vencida && tarefa.status !== "CONCLUIDA" && tarefa.status !== "CANCELADA" && (
                      <AlertTriangle className="inline ml-1 size-3" />
                    )}
                  </span>
                </TableCell>

                {/* Kanban */}
                <TableCell className="hidden xl:table-cell py-3 text-center">
                  {tarefa.card_public_id ? (
                    <LayoutGrid className="size-3.5 mx-auto text-blue-500" title={tarefa.card_titulo} />
                  ) : (
                    <span className="text-muted-foreground/40">—</span>
                  )}
                </TableCell>

                {/* Ações */}
                <TableCell className="py-3">
                  <div className="flex items-center justify-end gap-0.5">
                    <Button
                      variant="ghost" size="icon"
                      className="size-8 text-muted-foreground hover:text-foreground"
                      title="Ver detalhes"
                      onClick={() => setDetalhes(tarefa)}
                    >
                      <Eye className="size-4" />
                    </Button>

                    {tarefa.status !== "CONCLUIDA" && tarefa.status !== "CANCELADA" && (
                      <Button
                        variant="ghost" size="icon"
                        className="size-8 text-muted-foreground hover:text-foreground"
                        title="Editar"
                        onClick={() => setEditando(tarefa)}
                      >
                        <Pencil className="size-4" />
                      </Button>
                    )}

                    {(tarefa.status === "PENDENTE" || tarefa.status === "EM_PROGRESSO") && (
                      <Button
                        variant="ghost" size="icon"
                        className="size-8 text-muted-foreground hover:text-emerald-600"
                        title="Concluir"
                        onClick={() => handleConcluir(tarefa)}
                      >
                        <CheckCheck className="size-4" />
                      </Button>
                    )}

                    {tarefa.status === "CONCLUIDA" && (
                      <Button
                        variant="ghost" size="icon"
                        className="size-8 text-muted-foreground hover:text-amber-600"
                        title="Reabrir"
                        onClick={() => handleReabrir(tarefa)}
                      >
                        <RotateCcw className="size-4" />
                      </Button>
                    )}

                    {tarefa.status !== "CANCELADA" && tarefa.status !== "CONCLUIDA" && (
                      <Button
                        variant="ghost" size="icon"
                        className="size-8 text-muted-foreground hover:text-destructive"
                        title="Cancelar"
                        onClick={() => handleCancelar(tarefa)}
                      >
                        <XCircle className="size-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {filtered.length > 0 && (
          <div className="flex items-center justify-between border-t px-4 py-2.5 text-xs text-muted-foreground">
            <span>{filtered.length} tarefa(s) encontrada(s)</span>
          </div>
        )}
      </div>

      <DetalhesTarefaModal
        tarefa={detalhes}
        onClose={() => setDetalhes(null)}
        onConcluir={handleConcluir}
        onReabrir={handleReabrir}
        onCancelar={handleCancelar}
        onEditar={(t) => { setDetalhes(null); setEditando(t); }}
      />

      <EditTarefaModal
        tarefa={editando}
        open={!!editando}
        onClose={() => setEditando(null)}
        onSuccess={fetchTarefas}
      />

      <EditTarefaModal
        tarefa={null}
        isNew
        open={showNew}
        onClose={() => setShowNew(false)}
        onSuccess={fetchTarefas}
      />
    </div>
  );
}
