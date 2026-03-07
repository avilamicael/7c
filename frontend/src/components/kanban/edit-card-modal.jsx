import { useState, useEffect } from "react";
import { kanbanApi } from "@/lib/kanban.api";
import { tarefasApi } from "@/lib/tarefas.api";
import { usuariosApi } from "@/lib/usuarios.api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { DatePicker } from "@/components/ui/date-picker";
import { toast } from "sonner";
import { ListChecks, Unlink } from "lucide-react";
import { cn } from "@/lib/utils";

const PRIORIDADE_OPTIONS = [
  { value: "URGENTE", label: "Urgente" },
  { value: "ALTA",    label: "Alta" },
  { value: "MEDIA",   label: "Média" },
  { value: "BAIXA",   label: "Baixa" },
];

const TAREFA_STATUS = {
  PENDENTE:     { label: "Pendente",     color: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400" },
  EM_PROGRESSO: { label: "Em Progresso", color: "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400" },
  CONCLUIDA:    { label: "Concluída",    color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400" },
  CANCELADA:    { label: "Cancelada",    color: "bg-muted text-muted-foreground" },
};

function emptyForm(defaultColunaId) {
  return {
    titulo:          "",
    descricao:       "",
    prioridade:      "MEDIA",
    responsavel:     "",
    data_vencimento: "",
    lembrete_data:   "",
    lembrete_hora:   "",
    coluna:          defaultColunaId || "",
  };
}

export function EditCardModal({ open, card, defaultColunaId, colunas, onClose, onSuccess }) {
  const isNew = !card;

  const [form, setForm]               = useState(emptyForm(defaultColunaId));
  const [usuarios, setUsuarios]       = useState([]);
  const [loading, setLoading]         = useState(false);
  const [criarTarefa, setCriarTarefa] = useState(false);
  const [desvinculando, setDesvincul] = useState(false);

  useEffect(() => {
    if (!open) return;
    setCriarTarefa(false);
    usuariosApi.listar()
      .then((r) => r.json())
      .then((d) => setUsuarios(Array.isArray(d) ? d : (d?.results ?? [])))
      .catch(() => {});
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (card) {
      setForm({
        titulo:          card.titulo ?? "",
        descricao:       card.descricao ?? "",
        prioridade:      card.prioridade ?? "MEDIA",
        responsavel:     card.responsavel_public_id ?? "",
        data_vencimento: card.data_vencimento ?? "",
        lembrete_data:   card.lembrete_em ? card.lembrete_em.slice(0, 10) : "",
        lembrete_hora:   card.lembrete_em ? card.lembrete_em.slice(11, 16) : "",
        coluna:          card.coluna_public_id ?? "",
      });
    } else {
      setForm(emptyForm(defaultColunaId));
    }
  }, [open, card, defaultColunaId]);

  function set(field) {
    return (val) => setForm((f) => ({ ...f, [field]: val }));
  }

  async function handleDesvincular() {
    if (!card?.tarefa_public_id) return;
    setDesvincul(true);
    try {
      await tarefasApi.editar(card.tarefa_public_id, { card: null });
      toast.success("Tarefa desvinculada.");
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(err?.detail ?? "Erro ao desvincular tarefa.");
    } finally {
      setDesvincul(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.titulo.trim()) {
      toast.error("O título é obrigatório.");
      return;
    }
    if (!form.coluna) {
      toast.error("Selecione uma coluna.");
      return;
    }

    const payload = {
      titulo:          form.titulo.trim(),
      descricao:       form.descricao.trim() || undefined,
      prioridade:      form.prioridade,
      coluna:          form.coluna,
      responsavel:     form.responsavel || undefined,
      data_vencimento: form.data_vencimento || undefined,
      lembrete_em:     form.lembrete_data
        ? `${form.lembrete_data}T${form.lembrete_hora || "08:00"}:00`
        : null,
    };

    setLoading(true);
    try {
      let savedCard;
      if (isNew) {
        savedCard = await kanbanApi.cards.criar({ ...payload, posicao: 999999 });
        toast.success("Card criado.");
      } else {
        savedCard = await kanbanApi.cards.editar(card.public_id, payload);
        toast.success("Card atualizado.");
      }

      // Criar tarefa vinculada se solicitado
      if (criarTarefa && savedCard?.public_id) {
        try {
          await tarefasApi.criar({
            titulo:          form.titulo.trim(),
            descricao:       form.descricao.trim() || undefined,
            prioridade:      form.prioridade,
            status:          "PENDENTE",
            atribuido_a:     form.responsavel || undefined,
            data_vencimento: form.data_vencimento || undefined,
            card:            String(savedCard.public_id),
          });
          toast.success("Tarefa vinculada criada.");
        } catch {
          toast.error("Card salvo, mas não foi possível criar a tarefa.");
        }
      }

      onSuccess?.();
      onClose();
    } catch (err) {
      const msg = err?.detail ?? err?.titulo?.[0] ?? "Erro ao salvar card.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  const tarefaStatus = card?.tarefa_status ? (TAREFA_STATUS[card.tarefa_status] ?? null) : null;
  const temTarefa    = !!card?.tarefa_public_id;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isNew ? "Novo Card" : "Editar Card"}</DialogTitle>
          <DialogDescription>
            {isNew ? "Preencha os dados para criar um novo card." : "Atualize os dados do card."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="titulo">
              Título <span className="text-destructive">*</span>
            </Label>
            <Input
              id="titulo"
              value={form.titulo}
              onChange={(e) => set("titulo")(e.target.value)}
              placeholder="Título do card..."
              maxLength={255}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              value={form.descricao}
              onChange={(e) => set("descricao")(e.target.value)}
              placeholder="Detalhes adicionais..."
              rows={3}
              className="resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Coluna</Label>
              <Select
                value={form.coluna || "__none__"}
                onValueChange={(v) => set("coluna")(v === "__none__" ? "" : v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent className="w-full">
                  <SelectItem value="__none__">Selecione...</SelectItem>
                  {colunas.map((c) => (
                    <SelectItem key={c.public_id} value={String(c.public_id)}>
                      {c.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Prioridade</Label>
              <Select value={form.prioridade} onValueChange={set("prioridade")}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="w-full">
                  {PRIORIDADE_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Responsável</Label>
            <Select
              value={form.responsavel || "__none__"}
              onValueChange={(v) => set("responsavel")(v === "__none__" ? "" : v)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Sem responsável" />
              </SelectTrigger>
              <SelectContent className="w-full">
                <SelectItem value="__none__">Sem responsável</SelectItem>
                {usuarios.map((u) => (
                  <SelectItem key={u.public_id} value={String(u.public_id)}>
                    {u.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Vencimento</Label>
              <DatePicker value={form.data_vencimento} onChange={set("data_vencimento")} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Lembrete — data</Label>
              <DatePicker value={form.lembrete_data} onChange={set("lembrete_data")} placeholder="dd/mm/aaaa" />
            </div>
          </div>

          {form.lembrete_data && (
            <div className="flex flex-col gap-1.5">
              <Label>Lembrete — hora</Label>
              <input
                type="time"
                value={form.lembrete_hora || "08:00"}
                onChange={(e) => set("lembrete_hora")(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
          )}

          {/* ── Seção Tarefa ─────────────────────────────────────── */}
          <div className={cn(
            "rounded-lg border px-4 py-3 flex flex-col gap-3",
            temTarefa ? "border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/20" : "bg-muted/30"
          )}>
            <div className="flex items-center gap-2">
              <ListChecks className="size-4 text-muted-foreground shrink-0" />
              <span className="text-sm font-medium">Tarefa vinculada</span>
            </div>

            {temTarefa ? (
              /* Card já tem tarefa */
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Status:</span>
                  {tarefaStatus && (
                    <span className={cn("text-xs rounded-full px-2 py-0.5 font-medium", tarefaStatus.color)}>
                      {tarefaStatus.label}
                    </span>
                  )}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1.5 text-xs text-muted-foreground hover:text-destructive"
                  onClick={handleDesvincular}
                  disabled={desvinculando}
                >
                  <Unlink className="size-3.5" />
                  {desvinculando ? "Desvinculando..." : "Desvincular"}
                </Button>
              </div>
            ) : (
              /* Card sem tarefa — toggle para criar */
              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm">
                    {isNew ? "Criar tarefa ao salvar" : "Criar e vincular uma tarefa"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    A tarefa herdará título, prioridade, responsável e vencimento
                  </span>
                </div>
                <Switch checked={criarTarefa} onCheckedChange={setCriarTarefa} />
              </div>
            )}
          </div>
        </form>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Salvando..." : isNew ? "Criar Card" : "Salvar Alterações"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
