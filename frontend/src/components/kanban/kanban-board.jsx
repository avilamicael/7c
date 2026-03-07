import { useState, useEffect, useCallback, useRef } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { kanbanApi } from "@/lib/kanban.api";
import { KanbanColuna } from "./kanban-coluna";
import { KanbanCard } from "./kanban-card";
import { EditCardModal } from "./edit-card-modal";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Plus, LayoutGrid } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

function calcPosicao(cards, cardId) {
  const idx = cards.findIndex((c) => c.public_id === cardId);
  if (idx === -1) return 1000;
  const prev = cards[idx - 1];
  const next = cards[idx + 1];
  if (!prev && !next) return 1000;
  if (!prev) return Math.max(1, next.posicao - 500);
  if (!next) return prev.posicao + 1000;
  return Math.round((prev.posicao + next.posicao) / 2);
}

export function KanbanBoard() {
  const { usuario } = useAuth();
  const isAdmin = usuario?.role === "admin";

  const [boards, setBoards]           = useState([]);
  const [boardId, setBoardId]         = useState(null);
  const [colunas, setColunas]         = useState([]);
  const [cardsByColuna, setCards]     = useState({});
  const [loading, setLoading]         = useState(true);
  const [activeCard, setActiveCard]   = useState(null);
  const [modalOpen, setModalOpen]     = useState(false);
  const [editingCard, setEditingCard] = useState(null);
  const [defaultColId, setDefaultColId] = useState(null);

  // Ref para ter sempre o estado mais recente dentro dos handlers do DnD
  const cardsRef    = useRef({});
  const snapshotRef = useRef({});
  const sourceRef   = useRef(null);

  function setCardsSynced(updater) {
    setCards((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      cardsRef.current = next;
      return next;
    });
  }

  function findColuna(cardId) {
    for (const [colunaId, cards] of Object.entries(cardsRef.current)) {
      if (cards.some((c) => c.public_id === cardId)) return colunaId;
    }
    return null;
  }

  // ─── Carregamento ──────────────────────────────────────────────────────────

  useEffect(() => {
    kanbanApi.boards.listar()
      .then((data) => {
        const list = Array.isArray(data) ? data : (data?.results ?? []);
        setBoards(list);
        if (list.length > 0) setBoardId(String(list[0].public_id));
      })
      .catch(() => toast.error("Erro ao carregar boards."))
      .finally(() => setLoading(false));
  }, []);

  const fetchBoard = useCallback(async () => {
    if (!boardId) return;
    setLoading(true);
    try {
      const board = await kanbanApi.boards.buscar(boardId);
      const cols  = board.colunas ?? [];
      setColunas(cols);
      const map = {};
      for (const col of cols) map[col.public_id] = col.cards ?? [];
      setCardsSynced(map);
    } catch {
      toast.error("Erro ao carregar board.");
    } finally {
      setLoading(false);
    }
  }, [boardId]);

  useEffect(() => { fetchBoard(); }, [fetchBoard]);

  // ─── DnD ───────────────────────────────────────────────────────────────────

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  function handleDragStart({ active }) {
    snapshotRef.current = structuredClone(cardsRef.current);
    sourceRef.current   = findColuna(active.id);
    const col = cardsRef.current[sourceRef.current] ?? [];
    setActiveCard(col.find((c) => c.public_id === active.id) ?? null);
  }

  function handleDragOver({ active, over }) {
    if (!over) return;

    const src  = findColuna(active.id);
    const dest = cardsRef.current[over.id] !== undefined
      ? over.id
      : findColuna(over.id);

    if (!src || !dest || src === dest) return;

    setCardsSynced((prev) => {
      const srcCards  = [...prev[src]];
      const destCards = [...prev[dest]];
      const cardIdx   = srcCards.findIndex((c) => c.public_id === active.id);
      const [moved]   = srcCards.splice(cardIdx, 1);
      const overIdx   = destCards.findIndex((c) => c.public_id === over.id);
      if (overIdx >= 0) destCards.splice(overIdx, 0, moved);
      else destCards.push(moved);
      return { ...prev, [src]: srcCards, [dest]: destCards };
    });
  }

  async function handleDragEnd({ active, over }) {
    setActiveCard(null);

    if (!over) {
      setCardsSynced(snapshotRef.current);
      return;
    }

    const originalColuna = sourceRef.current;
    const currentColuna  = findColuna(active.id);

    if (!currentColuna) {
      setCardsSynced(snapshotRef.current);
      return;
    }

    let finalCards = cardsRef.current[currentColuna];

    if (originalColuna === currentColuna) {
      // Reordenação dentro da mesma coluna
      const overIsColuna = cardsRef.current[over.id] !== undefined;
      if (overIsColuna || over.id === active.id) return;

      const cards    = [...finalCards];
      const oldIdx   = cards.findIndex((c) => c.public_id === active.id);
      const newIdx   = cards.findIndex((c) => c.public_id === over.id);
      if (oldIdx === -1 || newIdx === -1 || oldIdx === newIdx) return;

      const reordered = arrayMove(cards, oldIdx, newIdx);
      setCardsSynced((prev) => ({ ...prev, [currentColuna]: reordered }));
      finalCards = reordered;
    }

    const posicao = calcPosicao(finalCards, active.id);

    try {
      const updated = await kanbanApi.cards.mover(active.id, { coluna: currentColuna, posicao });
      // Atualiza o objeto do card no estado com os dados do servidor
      // (coluna_public_id, tarefa_status, etc. ficam consistentes)
      if (updated?.public_id) {
        setCardsSynced((prev) => ({
          ...prev,
          [currentColuna]: prev[currentColuna].map((c) =>
            String(c.public_id) === String(active.id) ? { ...c, ...updated } : c
          ),
        }));
      }
    } catch {
      toast.error("Erro ao mover card.");
      setCardsSynced(snapshotRef.current);
    }
  }

  // ─── Ações ─────────────────────────────────────────────────────────────────

  function openNewCard(colunaId) {
    setDefaultColId(colunaId);
    setEditingCard(null);
    setModalOpen(true);
  }

  function openEditCard(card) {
    setEditingCard(card);
    setDefaultColId(null);
    setModalOpen(true);
  }

  async function handleArchive(card) {
    try {
      await kanbanApi.cards.arquivar(card.public_id);
      toast.success("Card arquivado.");
      fetchBoard();
    } catch {
      toast.error("Erro ao arquivar card.");
    }
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  if (loading && boards.length === 0) {
    return <div className="text-muted-foreground text-sm py-4">Carregando...</div>;
  }

  if (!loading && boards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
        <LayoutGrid className="size-10 text-muted-foreground/30" />
        <p className="text-sm text-muted-foreground">Nenhum board disponível.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {boards.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {boards.map((b) => (
            <button
              key={b.public_id}
              onClick={() => setBoardId(String(b.public_id))}
              className={cn(
                "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                String(b.public_id) === boardId
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              {b.nome}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="text-muted-foreground text-sm py-4">Carregando board...</div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-4 overflow-x-auto pb-6 items-start">
            {colunas.map((coluna) => (
              <KanbanColuna
                key={coluna.public_id}
                coluna={coluna}
                cards={cardsByColuna[coluna.public_id] ?? []}
                onAddCard={openNewCard}
                onEditCard={openEditCard}
                onArchiveCard={handleArchive}
              />
            ))}

            {isAdmin && (
              <Button
                variant="outline"
                size="sm"
                className="shrink-0 mt-0.5 gap-1.5 text-muted-foreground"
                disabled
              >
                <Plus className="size-3.5" />
                Nova Coluna
              </Button>
            )}
          </div>

          <DragOverlay dropAnimation={{ duration: 150, easing: "ease" }}>
            {activeCard ? <KanbanCard card={activeCard} isOverlay /> : null}
          </DragOverlay>
        </DndContext>
      )}

      <EditCardModal
        open={modalOpen}
        card={editingCard}
        defaultColunaId={defaultColId}
        colunas={colunas}
        onClose={() => setModalOpen(false)}
        onSuccess={fetchBoard}
      />
    </div>
  );
}
