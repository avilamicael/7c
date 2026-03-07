import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { KanbanCard } from "./kanban-card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

// Converte hex (#rrggbb) + alpha (0-255) para rgba
function hexAlpha(hex, alpha) {
  const h = (hex || "#5dca6c").replace("#", "");
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export function KanbanColuna({ coluna, cards, onAddCard, onEditCard, onArchiveCard }) {
  const { setNodeRef, isOver } = useDroppable({ id: coluna.public_id });

  const wipExceed = coluna.limite_wip != null && cards.length > coluna.limite_wip;
  const cor       = coluna.cor || "#5dca6c";

  return (
    <div className="flex flex-col w-72 shrink-0">
      {/* Header */}
      <div
        className="flex items-center gap-2 px-3 py-2.5 rounded-t-lg border border-b-0"
        style={{
          backgroundColor: hexAlpha(cor, 0.12),
          borderColor:     hexAlpha(cor, 0.35),
        }}
      >
        <div
          className="size-2.5 rounded-full shrink-0"
          style={{ backgroundColor: cor }}
        />
        <span className="font-semibold text-sm flex-1 truncate">{coluna.nome}</span>

        <span
          className={cn(
            "text-xs rounded-full px-1.5 py-0.5 font-medium leading-none",
            wipExceed
              ? "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400"
              : "bg-black/10 dark:bg-white/10 text-foreground/70"
          )}
        >
          {cards.length}
          {coluna.limite_wip != null ? `/${coluna.limite_wip}` : ""}
        </span>

        <Button
          variant="ghost"
          size="icon"
          className="size-6 shrink-0 text-muted-foreground hover:text-foreground"
          onClick={() => onAddCard(coluna.public_id)}
        >
          <Plus className="size-3.5" />
        </Button>
      </div>

      {/* Cards */}
      <div
        ref={setNodeRef}
        className="flex flex-col gap-2 flex-1 min-h-16 p-2 rounded-b-lg border transition-colors"
        style={{
          backgroundColor: isOver ? hexAlpha(cor, 0.22) : hexAlpha(cor, 0.07),
          borderColor:     hexAlpha(cor, 0.35),
        }}
      >
        <SortableContext
          items={cards.map((c) => c.public_id)}
          strategy={verticalListSortingStrategy}
        >
          {cards.map((card) => (
            <KanbanCard
              key={card.public_id}
              card={card}
              onEdit={() => onEditCard(card)}
              onArchive={() => onArchiveCard(card)}
            />
          ))}
        </SortableContext>

        {cards.length === 0 && !isOver && (
          <div className="flex items-center justify-center h-10 text-xs select-none"
            style={{ color: hexAlpha(cor, 0.4) }}>
            Vazio
          </div>
        )}
      </div>
    </div>
  );
}
