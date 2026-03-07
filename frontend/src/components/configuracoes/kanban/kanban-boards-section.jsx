import { useState, useEffect, useCallback } from "react";
import { kanbanApi } from "@/lib/kanban.api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  Plus, Pencil, PowerOff, Power, ChevronDown, ChevronRight, Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Dialog Board ─────────────────────────────────────────────────────────────

function BoardDialog({ open, board, onClose, onSuccess }) {
  const isNew = !board;
  const [form, setForm]       = useState({ nome: "", descricao: "", compartilhado: true });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(
      board
        ? { nome: board.nome ?? "", descricao: board.descricao ?? "", compartilhado: board.compartilhado ?? true }
        : { nome: "", descricao: "", compartilhado: true }
    );
  }, [open, board]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.nome.trim()) { toast.error("O nome é obrigatório."); return; }
    setLoading(true);
    try {
      const payload = {
        nome: form.nome.trim(),
        descricao: form.descricao.trim() || "",
        compartilhado: form.compartilhado,
      };
      if (isNew) {
        await kanbanApi.boards.criar(payload);
        toast.success("Board criado.");
      } else {
        await kanbanApi.boards.editar(board.public_id, payload);
        toast.success("Board atualizado.");
      }
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err?.detail ?? err?.nome?.[0] ?? "Erro ao salvar board.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isNew ? "Novo Board" : "Editar Board"}</DialogTitle>
          <DialogDescription>
            {isNew ? "Configure um novo board Kanban." : "Atualize as configurações do board."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="nome">Nome <span className="text-destructive">*</span></Label>
            <Input
              id="nome"
              value={form.nome}
              onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
              placeholder="Ex: Atendimento, Vendas..."
              maxLength={150}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              value={form.descricao}
              onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))}
              placeholder="Descreva o propósito deste board..."
              rows={2}
              className="resize-none"
            />
          </div>
          <div className="flex items-center justify-between rounded-lg border px-4 py-3">
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-medium">Compartilhado</span>
              <span className="text-xs text-muted-foreground">Visível para todos os membros</span>
            </div>
            <Switch
              checked={form.compartilhado}
              onCheckedChange={(v) => setForm((f) => ({ ...f, compartilhado: v }))}
            />
          </div>
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Salvando..." : isNew ? "Criar Board" : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Dialog Coluna ────────────────────────────────────────────────────────────

const COR_PRESETS = [
  "#5dca6c", "#3b82f6", "#f59e0b", "#ef4444",
  "#8b5cf6", "#ec4899", "#14b8a6", "#6b7280",
];

const ACAO_STATUS_OPTIONS = [
  { value: "__none__",    label: "Nenhuma ação" },
  { value: "PENDENTE",    label: "→ Alterar tarefa para Pendente" },
  { value: "EM_PROGRESSO", label: "→ Alterar tarefa para Em Progresso" },
  { value: "CONCLUIDA",   label: "→ Alterar tarefa para Concluída" },
  { value: "CANCELADA",   label: "→ Alterar tarefa para Cancelada" },
];

function ColunaDialog({ open, coluna, boardId, onClose, onSuccess }) {
  const isNew = !coluna;
  const [form, setForm]       = useState({ nome: "", posicao: 0, cor: "#5dca6c", limite_wip: "", acao_alterar_status: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    const acaoAtual = coluna?.acao_alterar_status ?? "";
    setForm(
      coluna
        ? {
            nome:                coluna.nome ?? "",
            posicao:             coluna.posicao ?? 0,
            cor:                 coluna.cor ?? "#5dca6c",
            limite_wip:          coluna.limite_wip != null ? String(coluna.limite_wip) : "",
            acao_alterar_status: acaoAtual,
          }
        : { nome: "", posicao: 0, cor: "#5dca6c", limite_wip: "", acao_alterar_status: "" }
    );
  }, [open, coluna]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.nome.trim()) { toast.error("O nome é obrigatório."); return; }
    setLoading(true);
    try {
      const payload = {
        nome:                form.nome.trim(),
        posicao:             Number(form.posicao) || 0,
        cor:                 form.cor,
        limite_wip:          form.limite_wip !== "" ? Number(form.limite_wip) : null,
        acao_alterar_status: form.acao_alterar_status || null,
      };
      if (isNew) {
        await kanbanApi.colunas.criar(boardId, payload);
        toast.success("Coluna criada.");
      } else {
        await kanbanApi.colunas.editar(boardId, coluna.public_id, payload);
        toast.success("Coluna atualizada.");
      }
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err?.detail ?? err?.nome?.[0] ?? "Erro ao salvar coluna.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{isNew ? "Nova Coluna" : "Editar Coluna"}</DialogTitle>
          <DialogDescription>
            {isNew ? "Adicione uma coluna a este board." : "Atualize os dados da coluna."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="col-nome">Nome <span className="text-destructive">*</span></Label>
            <Input
              id="col-nome"
              value={form.nome}
              onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
              placeholder="Ex: A Fazer, Em Progresso, Concluído..."
              maxLength={100}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="col-posicao">Posição</Label>
              <Input
                id="col-posicao"
                type="number"
                min={0}
                value={form.posicao}
                onChange={(e) => setForm((f) => ({ ...f, posicao: e.target.value }))}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="col-wip">Limite WIP</Label>
              <Input
                id="col-wip"
                type="number"
                min={1}
                value={form.limite_wip}
                onChange={(e) => setForm((f) => ({ ...f, limite_wip: e.target.value }))}
                placeholder="Sem limite"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label>Cor</Label>
            <div className="flex items-center gap-2 flex-wrap">
              {COR_PRESETS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, cor: c }))}
                  className={cn(
                    "size-7 rounded-full border-2 transition-transform",
                    form.cor === c ? "border-foreground scale-110" : "border-transparent"
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
              <input
                type="color"
                value={form.cor}
                onChange={(e) => setForm((f) => ({ ...f, cor: e.target.value }))}
                className="size-7 rounded cursor-pointer border"
                title="Cor personalizada"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Ação ao entrar nesta coluna</Label>
            <select
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
              value={form.acao_alterar_status || "__none__"}
              onChange={(e) => setForm((f) => ({ ...f, acao_alterar_status: e.target.value === "__none__" ? "" : e.target.value }))}
            >
              {ACAO_STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">
              Quando um card com tarefa vinculada entrar nesta coluna, o status da tarefa será atualizado automaticamente.
            </p>
          </div>
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Salvando..." : isNew ? "Criar Coluna" : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Board Row com Colunas ────────────────────────────────────────────────────

function BoardRow({ board, onEdit, onToggleAtivo, onRefresh }) {
  const [expanded, setExpanded] = useState(false);
  const [colunas, setColunas]   = useState([]);
  const [loadingCols, setLoadingCols] = useState(false);
  const [colunaDialog, setColunaDialog] = useState(false);
  const [editingColuna, setEditingColuna] = useState(null);

  const fetchColunas = useCallback(async () => {
    setLoadingCols(true);
    try {
      const data = await kanbanApi.colunas.listar(board.public_id);
      setColunas(Array.isArray(data) ? data : (data?.results ?? []));
    } catch {
      toast.error("Erro ao carregar colunas.");
    } finally {
      setLoadingCols(false);
    }
  }, [board.public_id]);

  function handleExpand() {
    if (!expanded) fetchColunas();
    setExpanded((v) => !v);
  }

  function openNewColuna() {
    setEditingColuna(null);
    setColunaDialog(true);
  }

  function openEditColuna(col) {
    setEditingColuna(col);
    setColunaDialog(true);
  }

  async function handleExcluirColuna(col) {
    if (!confirm(`Excluir a coluna "${col.nome}"? Os cards serão perdidos.`)) return;
    try {
      await kanbanApi.colunas.excluir(board.public_id, col.public_id);
      toast.success("Coluna excluída.");
      fetchColunas();
    } catch (err) {
      toast.error(err?.detail ?? "Erro ao excluir coluna.");
    }
  }

  return (
    <div className={cn("rounded-lg border bg-card transition-opacity", !board.ativo && "opacity-50")}>
      {/* Header do board */}
      <div className="flex items-center gap-2 px-4 py-3">
        <button
          onClick={handleExpand}
          className="flex items-center gap-2 flex-1 min-w-0 text-left"
        >
          {expanded
            ? <ChevronDown className="size-4 text-muted-foreground shrink-0" />
            : <ChevronRight className="size-4 text-muted-foreground shrink-0" />
          }
          <span className="font-medium text-sm truncate">{board.nome}</span>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className={cn(
              "text-[11px] rounded-full px-1.5 py-0.5 font-medium leading-none",
              board.compartilhado
                ? "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400"
                : "bg-muted text-muted-foreground"
            )}>
              {board.compartilhado ? "Público" : "Privado"}
            </span>
            {!board.ativo && (
              <span className="text-[11px] rounded-full px-1.5 py-0.5 bg-muted text-muted-foreground font-medium leading-none">
                Inativo
              </span>
            )}
          </div>
        </button>

        <div className="flex items-center gap-1 shrink-0">
          <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-foreground"
            title="Editar board" onClick={onEdit}>
            <Pencil className="size-3.5" />
          </Button>
          <Button
            variant="ghost" size="icon"
            className={cn("size-8", board.ativo
              ? "text-muted-foreground hover:text-destructive"
              : "text-muted-foreground hover:text-emerald-600")}
            title={board.ativo ? "Desativar" : "Reativar"}
            onClick={onToggleAtivo}
          >
            {board.ativo ? <PowerOff className="size-3.5" /> : <Power className="size-3.5" />}
          </Button>
        </div>
      </div>

      {/* Colunas expandidas */}
      {expanded && (
        <div className="border-t px-4 pb-4 pt-3 flex flex-col gap-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Colunas
            </span>
            <Button size="sm" variant="outline" className="h-7 gap-1 text-xs px-2" onClick={openNewColuna}>
              <Plus className="size-3" />
              Nova Coluna
            </Button>
          </div>

          {loadingCols ? (
            <p className="text-xs text-muted-foreground py-2">Carregando...</p>
          ) : colunas.length === 0 ? (
            <p className="text-xs text-muted-foreground py-2">
              Nenhuma coluna. Crie a primeira para começar a usar o board.
            </p>
          ) : (
            <div className="flex flex-col gap-1.5">
              {colunas
                .slice()
                .sort((a, b) => a.posicao - b.posicao)
                .map((col) => (
                  <div key={col.public_id}
                    className="flex items-center gap-2.5 rounded-md border bg-muted/30 px-3 py-2">
                    <div className="size-2.5 rounded-full shrink-0" style={{ backgroundColor: col.cor || "#5dca6c" }} />
                    <span className="text-sm flex-1 truncate">{col.nome}</span>
                    <span className="text-xs text-muted-foreground shrink-0">pos. {col.posicao}</span>
                    {col.limite_wip != null && (
                      <span className="text-[11px] rounded-full px-1.5 py-0.5 bg-muted text-muted-foreground font-medium leading-none shrink-0">
                        WIP {col.limite_wip}
                      </span>
                    )}
                    <Button variant="ghost" size="icon" className="size-6 text-muted-foreground hover:text-foreground"
                      onClick={() => openEditColuna(col)}>
                      <Pencil className="size-3" />
                    </Button>
                    <Button variant="ghost" size="icon" className="size-6 text-muted-foreground hover:text-destructive"
                      onClick={() => handleExcluirColuna(col)}>
                      <Trash2 className="size-3" />
                    </Button>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      <ColunaDialog
        open={colunaDialog}
        coluna={editingColuna}
        boardId={board.public_id}
        onClose={() => setColunaDialog(false)}
        onSuccess={fetchColunas}
      />
    </div>
  );
}

// ─── Seção principal ──────────────────────────────────────────────────────────

export function KanbanBoardsSection() {
  const [boards, setBoards]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [boardDialog, setBoardDialog] = useState(false);
  const [editingBoard, setEditingBoard] = useState(null);

  const fetchBoards = useCallback(async () => {
    setLoading(true);
    try {
      const data = await kanbanApi.boards.listar();
      setBoards(Array.isArray(data) ? data : (data?.results ?? []));
    } catch {
      toast.error("Erro ao carregar boards.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchBoards(); }, [fetchBoards]);

  async function toggleAtivo(board) {
    try {
      await kanbanApi.boards.toggleAtivo(board.public_id, !board.ativo);
      toast.success(board.ativo ? "Board desativado." : "Board reativado.");
      fetchBoards();
    } catch (err) {
      toast.error(err?.detail ?? "Erro ao alterar status.");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold">Boards Kanban</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Crie boards e configure suas colunas. Clique em um board para gerenciar as colunas.
          </p>
        </div>
        <Button size="sm" className="gap-1.5" onClick={() => { setEditingBoard(null); setBoardDialog(true); }}>
          <Plus className="size-3.5" />
          Novo Board
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : boards.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed py-12 text-center">
          <p className="text-sm text-muted-foreground">Nenhum board criado ainda.</p>
          <Button size="sm" variant="outline" className="gap-1.5"
            onClick={() => { setEditingBoard(null); setBoardDialog(true); }}>
            <Plus className="size-3.5" />
            Criar primeiro board
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {boards.map((board) => (
            <BoardRow
              key={board.public_id}
              board={board}
              onEdit={() => { setEditingBoard(board); setBoardDialog(true); }}
              onToggleAtivo={() => toggleAtivo(board)}
              onRefresh={fetchBoards}
            />
          ))}
        </div>
      )}

      <BoardDialog
        open={boardDialog}
        board={editingBoard}
        onClose={() => setBoardDialog(false)}
        onSuccess={fetchBoards}
      />
    </div>
  );
}
