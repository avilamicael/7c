import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Pencil, CheckCheck, RotateCcw, XCircle, LayoutGrid, Calendar, Bell, User } from "lucide-react";

const STATUS_CONFIG = {
  PENDENTE:     { label: "Pendente",     color: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900" },
  EM_PROGRESSO: { label: "Em Progresso", color: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900" },
  CONCLUIDA:    { label: "Concluída",    color: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900" },
  CANCELADA:    { label: "Cancelada",    color: "bg-muted text-muted-foreground border-border" },
};

const PRIORIDADE_CONFIG = {
  URGENTE: { label: "Urgente", color: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900" },
  ALTA:    { label: "Alta",    color: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-400 dark:border-orange-900" },
  MEDIA:   { label: "Média",   color: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-400 dark:border-sky-900" },
  BAIXA:   { label: "Baixa",   color: "bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-950/40 dark:text-slate-400 dark:border-slate-700" },
};

function Badge({ config, value }) {
  const cfg = config[value] ?? { label: value, color: "bg-muted text-muted-foreground border-border" };
  return (
    <span className={cn("inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-medium", cfg.color)}>
      {cfg.label}
    </span>
  );
}

function Field({ icon: Icon, label, children }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground w-32 shrink-0 pt-0.5">
        {Icon && <Icon className="size-3.5" />}
        {label}
      </div>
      <div className="text-sm flex-1">{children}</div>
    </div>
  );
}

function formatDate(date) {
  if (!date) return "—";
  return new Date(date + "T00:00:00").toLocaleDateString("pt-BR");
}

function formatDateTime(dt) {
  if (!dt) return "—";
  return new Date(dt).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

export function DetalhesTarefaModal({ tarefa, onClose, onConcluir, onReabrir, onCancelar, onEditar }) {
  if (!tarefa) return null;

  const isActive = tarefa.status === "PENDENTE" || tarefa.status === "EM_PROGRESSO";
  const isConcluida = tarefa.status === "CONCLUIDA";
  const isCancelada = tarefa.status === "CANCELADA";

  return (
    <Dialog open={!!tarefa} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className={cn(isConcluida && "line-through text-muted-foreground")}>
            {tarefa.titulo}
          </DialogTitle>
          <DialogDescription>
            Criada em {formatDateTime(tarefa.data_cadastro)}
            {tarefa.criado_por_nome ? ` por ${tarefa.criado_por_nome}` : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          {/* Badges de status e prioridade */}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge config={STATUS_CONFIG} value={tarefa.status} />
            <Badge config={PRIORIDADE_CONFIG} value={tarefa.prioridade} />
            {tarefa.vencida && isActive && (
              <span className="inline-flex items-center rounded-md border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900">
                Vencida
              </span>
            )}
          </div>

          {/* Descrição */}
          {tarefa.descricao && (
            <p className="text-sm text-muted-foreground leading-relaxed">{tarefa.descricao}</p>
          )}

          <div className="flex flex-col gap-3 rounded-lg border bg-muted/30 px-4 py-3">
            <Field icon={User} label="Responsável">
              {tarefa.atribuido_a_nome ?? <span className="text-muted-foreground">—</span>}
            </Field>

            <Field icon={Calendar} label="Vencimento">
              <span className={cn(tarefa.vencida && isActive && "text-red-600 dark:text-red-400 font-medium")}>
                {formatDate(tarefa.data_vencimento)}
              </span>
            </Field>

            {tarefa.lembrete_em && (
              <Field icon={Bell} label="Lembrete">
                {formatDateTime(tarefa.lembrete_em)}
              </Field>
            )}

            {tarefa.card_public_id && (
              <Field icon={LayoutGrid} label="Card Kanban">
                <span className="text-blue-600 dark:text-blue-400">{tarefa.card_titulo ?? tarefa.card_public_id}</span>
              </Field>
            )}

            {isConcluida && tarefa.data_conclusao && (
              <Field icon={Calendar} label="Concluída em">
                {formatDateTime(tarefa.data_conclusao)}
              </Field>
            )}
          </div>
        </div>

        <DialogFooter className="flex-wrap gap-2 sm:gap-2">
          {!isConcluida && !isCancelada && (
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => onEditar?.(tarefa)}>
              <Pencil className="size-3.5" />
              Editar
            </Button>
          )}

          {isActive && (
            <Button variant="outline" size="sm" className="gap-1.5 text-emerald-700 border-emerald-200 hover:bg-emerald-50 dark:text-emerald-400 dark:border-emerald-900" onClick={() => { onConcluir?.(tarefa); onClose(); }}>
              <CheckCheck className="size-3.5" />
              Concluir
            </Button>
          )}

          {isConcluida && (
            <Button variant="outline" size="sm" className="gap-1.5 text-amber-700 border-amber-200 hover:bg-amber-50 dark:text-amber-400 dark:border-amber-900" onClick={() => { onReabrir?.(tarefa); onClose(); }}>
              <RotateCcw className="size-3.5" />
              Reabrir
            </Button>
          )}

          {isActive && (
            <Button variant="outline" size="sm" className="gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/5" onClick={() => { onCancelar?.(tarefa); onClose(); }}>
              <XCircle className="size-3.5" />
              Cancelar
            </Button>
          )}

          <Button variant="outline" size="sm" onClick={onClose}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
