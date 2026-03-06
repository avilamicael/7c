import { useState, useEffect } from "react";
import { kanbanApi } from "@/lib/kanban.api";
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
import { DatePicker } from "@/components/ui/date-picker";
import { toast } from "sonner";

const PRIORIDADE_OPTIONS = [
  { value: "URGENTE", label: "Urgente" },
  { value: "ALTA",    label: "Alta" },
  { value: "MEDIA",   label: "Média" },
  { value: "BAIXA",   label: "Baixa" },
];

function emptyForm(defaultColunaId) {
  return {
    titulo:         "",
    descricao:      "",
    prioridade:     "MEDIA",
    responsavel:    "",
    data_vencimento: "",
    coluna:         defaultColunaId || "",
  };
}

export function EditCardModal({ open, card, defaultColunaId, colunas, onClose, onSuccess }) {
  const isNew = !card;

  const [form, setForm]         = useState(emptyForm(defaultColunaId));
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
    if (card) {
      setForm({
        titulo:          card.titulo ?? "",
        descricao:       card.descricao ?? "",
        prioridade:      card.prioridade ?? "MEDIA",
        responsavel:     card.responsavel_public_id ?? "",
        data_vencimento: card.data_vencimento ?? "",
        coluna:          card.coluna_public_id ?? "",
      });
    } else {
      setForm(emptyForm(defaultColunaId));
    }
  }, [open, card, defaultColunaId]);

  function set(field) {
    return (val) => setForm((f) => ({ ...f, [field]: val }));
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
    };

    setLoading(true);
    try {
      if (isNew) {
        await kanbanApi.cards.criar({ ...payload, posicao: 999999 });
        toast.success("Card criado.");
      } else {
        await kanbanApi.cards.editar(card.public_id, payload);
        toast.success("Card atualizado.");
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

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isNew ? "Novo Card" : "Editar Card"}</DialogTitle>
          <DialogDescription>
            {isNew
              ? "Preencha os dados para criar um novo card."
              : "Atualize os dados do card."}
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

          <div className="flex flex-col gap-1.5">
            <Label>Vencimento</Label>
            <DatePicker value={form.data_vencimento} onChange={set("data_vencimento")} />
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
