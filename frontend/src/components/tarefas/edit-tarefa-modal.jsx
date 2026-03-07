import { useState, useEffect } from "react";
import { tarefasApi } from "@/lib/tarefas.api";
import { usuariosApi } from "@/lib/usuarios.api";
import { kanbanApi } from "@/lib/kanban.api";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { toast } from "sonner";
import { LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";

const PRIORIDADE_OPTIONS = [
  { value: "URGENTE", label: "Urgente" },
  { value: "ALTA",    label: "Alta" },
  { value: "MEDIA",   label: "Média" },
  { value: "BAIXA",   label: "Baixa" },
];

const STATUS_OPTIONS = [
  { value: "PENDENTE",     label: "Pendente" },
  { value: "EM_PROGRESSO", label: "Em Progresso" },
];

// "none" = sem vínculo | "existente" = vincular card existente | "novo" = criar novo card
const MODOS_KANBAN = [
  { value: "none",      label: "Sem vínculo" },
  { value: "existente", label: "Vincular a card existente" },
  { value: "novo",      label: "Criar novo card no Kanban" },
];

function emptyForm() {
  return {
    titulo: "",
    descricao: "",
    prioridade: "MEDIA",
    status: "PENDENTE",
    atribuido_a: "",
    data_vencimento: "",
    lembrete_data: "",
    lembrete_hora: "",
  };
}

export function EditTarefaModal({ tarefa, open, onClose, onSuccess, isNew = false }) {
  const [form, setForm]         = useState(emptyForm());
  const [usuarios, setUsuarios] = useState([]);
  const [cards, setCards]       = useState([]);
  const [boards, setBoards]     = useState([]);
  const [loading, setLoading]   = useState(false);

  // Estado do vínculo Kanban
  const [modoKanban, setModoKanban]   = useState("none");
  const [cardId, setCardId]           = useState("");       // modo existente
  const [novoBoardId, setNovoBoardId] = useState("");       // modo novo
  const [novaColunaId, setNovaColunaId] = useState("");     // modo novo

  useEffect(() => {
    if (!open) return;

    usuariosApi.listar()
      .then((r) => r.json())
      .then((d) => setUsuarios(Array.isArray(d) ? d : (d?.results ?? [])))
      .catch(() => {});

    kanbanApi.cards.listar()
      .then((d) => setCards(Array.isArray(d) ? d : (d?.results ?? [])))
      .catch(() => {});

    kanbanApi.boards.listar()
      .then((d) => setBoards(Array.isArray(d) ? d : (d?.results ?? [])))
      .catch(() => {});
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setModoKanban("none");
    setCardId("");
    setNovoBoardId("");
    setNovaColunaId("");

    if (tarefa && !isNew) {
      setForm({
        titulo:          tarefa.titulo ?? "",
        descricao:       tarefa.descricao ?? "",
        prioridade:      tarefa.prioridade ?? "MEDIA",
        status:          tarefa.status ?? "PENDENTE",
        atribuido_a:     tarefa.atribuido_a_public_id ? String(tarefa.atribuido_a_public_id) : "",
        data_vencimento: tarefa.data_vencimento ?? "",
        lembrete_data:   tarefa.lembrete_em ? tarefa.lembrete_em.slice(0, 10) : "",
        lembrete_hora:   tarefa.lembrete_em ? tarefa.lembrete_em.slice(11, 16) : "",
      });
      if (tarefa.card_public_id) {
        setModoKanban("existente");
        setCardId(String(tarefa.card_public_id));
      }
    } else {
      setForm(emptyForm());
    }
  }, [open, tarefa, isNew]);

  function set(field) {
    return (val) => setForm((f) => ({ ...f, [field]: val }));
  }

  // Cards disponíveis: sem tarefa OU já vinculado a esta tarefa
  const cardsDisponiveis = cards.filter(
    (c) => !c.tarefa_public_id || String(c.public_id) === String(tarefa?.card_public_id)
  );

  // Colunas do board selecionado para criação de novo card
  const colunasDoBoardNovo = boards.find(
    (b) => String(b.public_id) === novoBoardId
  )?.colunas ?? [];

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.titulo.trim()) {
      toast.error("O título é obrigatório.");
      return;
    }
    if (modoKanban === "existente" && !cardId) {
      toast.error("Selecione um card existente ou mude o modo de vínculo.");
      return;
    }
    if (modoKanban === "novo" && !novaColunaId) {
      toast.error("Selecione o board e a coluna para criar o card.");
      return;
    }

    const payload = {
      titulo:          form.titulo.trim(),
      descricao:       form.descricao.trim() || undefined,
      prioridade:      form.prioridade,
      status:          form.status,
      atribuido_a:     form.atribuido_a || undefined,
      data_vencimento: form.data_vencimento || undefined,
      lembrete_em:     form.lembrete_data
        ? `${form.lembrete_data}T${form.lembrete_hora || "08:00"}:00`
        : undefined,
      card:            null,
    };

    setLoading(true);
    try {
      // Criar novo card antes de salvar a tarefa
      if (modoKanban === "novo") {
        const novoCard = await kanbanApi.cards.criar({
          titulo:          form.titulo.trim(),
          descricao:       form.descricao.trim() || undefined,
          prioridade:      form.prioridade,
          coluna:          novaColunaId,
          responsavel:     form.atribuido_a || undefined,
          data_vencimento: form.data_vencimento || undefined,
          posicao:         999999,
        });
        payload.card = String(novoCard.public_id);
      } else if (modoKanban === "existente") {
        payload.card = cardId || null;
      }

      if (isNew || !tarefa) {
        await tarefasApi.criar(payload);
        toast.success("Tarefa criada com sucesso.");
      } else {
        await tarefasApi.editar(tarefa.public_id, payload);
        toast.success("Tarefa atualizada.");
      }
      onSuccess?.();
      onClose();
    } catch (err) {
      const msg = err?.detail ?? err?.titulo?.[0] ?? err?.card?.[0] ?? "Erro ao salvar tarefa.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isNew || !tarefa ? "Nova Tarefa" : "Editar Tarefa"}</DialogTitle>
          <DialogDescription>
            {isNew || !tarefa
              ? "Preencha os dados para criar uma nova tarefa."
              : "Atualize os dados da tarefa."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 py-2">
          {/* Título */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="titulo">Título <span className="text-destructive">*</span></Label>
            <Input
              id="titulo"
              value={form.titulo}
              onChange={(e) => set("titulo")(e.target.value)}
              placeholder="Descreva a tarefa..."
              maxLength={255}
            />
          </div>

          {/* Descrição */}
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

          {/* Prioridade + Status */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Prioridade</Label>
              <Select value={form.prioridade} onValueChange={set("prioridade")}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent className="w-full">
                  {PRIORIDADE_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={set("status")}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent className="w-full">
                  {STATUS_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Responsável */}
          <div className="flex flex-col gap-1.5">
            <Label>Responsável</Label>
            <Select
              value={form.atribuido_a || "__none__"}
              onValueChange={(v) => set("atribuido_a")(v === "__none__" ? "" : v)}
            >
              <SelectTrigger className="w-full"><SelectValue placeholder="Sem responsável" /></SelectTrigger>
              <SelectContent className="w-full">
                <SelectItem value="__none__">Sem responsável</SelectItem>
                {usuarios.map((u) => (
                  <SelectItem key={u.public_id} value={String(u.public_id)}>{u.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Vínculo com Kanban */}
          <div className={cn(
            "flex flex-col gap-3 rounded-lg border px-4 py-3",
            modoKanban !== "none" ? "border-blue-200 bg-blue-50/40 dark:border-blue-900 dark:bg-blue-950/20" : "bg-muted/30"
          )}>
            <div className="flex items-center gap-2">
              <LayoutGrid className="size-4 text-muted-foreground shrink-0" />
              <span className="text-sm font-medium">Kanban</span>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Modo de vínculo</Label>
              <Select value={modoKanban} onValueChange={(v) => { setModoKanban(v); setCardId(""); setNovoBoardId(""); setNovaColunaId(""); }}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent className="w-full">
                  {MODOS_KANBAN.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Card existente */}
            {modoKanban === "existente" && (
              <div className="flex flex-col gap-1.5">
                <Label>Card</Label>
                <Select
                  value={cardId || "__none__"}
                  onValueChange={(v) => setCardId(v === "__none__" ? "" : v)}
                >
                  <SelectTrigger className="w-full"><SelectValue placeholder="Selecione o card..." /></SelectTrigger>
                  <SelectContent className="w-full">
                    <SelectItem value="__none__">Selecione o card...</SelectItem>
                    {cardsDisponiveis.map((c) => (
                      <SelectItem key={c.public_id} value={String(c.public_id)}>
                        {c.titulo}
                        <span className="text-muted-foreground ml-1">— {c.coluna_nome}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Criar novo card */}
            {modoKanban === "novo" && (
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label>Board</Label>
                  <Select
                    value={novoBoardId || "__none__"}
                    onValueChange={(v) => { setNovoBoardId(v === "__none__" ? "" : v); setNovaColunaId(""); }}
                  >
                    <SelectTrigger className="w-full"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent className="w-full">
                      <SelectItem value="__none__">Selecione...</SelectItem>
                      {boards.map((b) => (
                        <SelectItem key={b.public_id} value={String(b.public_id)}>{b.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label>Coluna</Label>
                  <Select
                    value={novaColunaId || "__none__"}
                    onValueChange={(v) => setNovaColunaId(v === "__none__" ? "" : v)}
                    disabled={!novoBoardId}
                  >
                    <SelectTrigger className="w-full"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent className="w-full">
                      <SelectItem value="__none__">Selecione...</SelectItem>
                      {colunasDoBoardNovo.map((c) => (
                        <SelectItem key={c.public_id} value={String(c.public_id)}>{c.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>

          {/* Datas */}
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
        </form>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Salvando..." : isNew || !tarefa ? "Criar Tarefa" : "Salvar Alterações"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
