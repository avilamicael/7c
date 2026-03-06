import { useState, useEffect } from "react";
import { tarefasApi } from "@/lib/tarefas.api";
import { usuariosApi } from "@/lib/usuarios.api";
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

function emptyForm() {
  return {
    titulo: "",
    descricao: "",
    prioridade: "MEDIA",
    status: "PENDENTE",
    atribuido_a: "",
    data_vencimento: "",
    lembrete_em: "",
  };
}

export function EditTarefaModal({ tarefa, open, onClose, onSuccess, isNew = false }) {
  const [form, setForm]         = useState(emptyForm());
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading]   = useState(false);

  useEffect(() => {
    if (!open) return;
    usuariosApi.listar()
      .then((r) => r.json())
      .then((d) => setUsuarios(Array.isArray(d) ? d : (d?.results ?? [])))
      .catch(() => {});
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (tarefa && !isNew) {
      setForm({
        titulo:          tarefa.titulo ?? "",
        descricao:       tarefa.descricao ?? "",
        prioridade:      tarefa.prioridade ?? "MEDIA",
        status:          tarefa.status ?? "PENDENTE",
        atribuido_a:     tarefa.atribuido_a_public_id ? String(tarefa.atribuido_a_public_id) : "",
        data_vencimento: tarefa.data_vencimento ?? "",
        lembrete_em:     tarefa.lembrete_em ? tarefa.lembrete_em.slice(0, 10) : "",
      });
    } else {
      setForm(emptyForm());
    }
  }, [open, tarefa, isNew]);

  function set(field) {
    return (val) => setForm((f) => ({ ...f, [field]: val }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.titulo.trim()) {
      toast.error("O título é obrigatório.");
      return;
    }

    const payload = {
      titulo:          form.titulo.trim(),
      descricao:       form.descricao.trim() || undefined,
      prioridade:      form.prioridade,
      status:          form.status,
      atribuido_a:     form.atribuido_a || undefined,
      data_vencimento: form.data_vencimento || undefined,
      lembrete_em:     form.lembrete_em || undefined,
    };

    setLoading(true);
    try {
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
      const msg = err?.detail ?? err?.titulo?.[0] ?? "Erro ao salvar tarefa.";
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
                  <SelectItem key={u.public_id} value={String(u.public_id)}>
                    {u.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Data de vencimento + Lembrete */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Vencimento</Label>
              <DatePicker value={form.data_vencimento} onChange={set("data_vencimento")} />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Lembrete</Label>
              <DatePicker value={form.lembrete_em} onChange={set("lembrete_em")} placeholder="dd/mm/aaaa" />
            </div>
          </div>
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
