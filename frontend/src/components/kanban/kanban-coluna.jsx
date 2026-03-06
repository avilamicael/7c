import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { KanbanCard } from "./kanban-card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export function KanbanColuna({ coluna, cards, onAddCard, onEditCard, onArchiveCard }) {
  const { setNodeRef, isOver } = useDroppable({ id: coluna.public_id });

  const wipExceed = coluna.limite_wip != null && cards.length > coluna.limite_wip;

  return (
    <div className="flex flex-col w-72 shrink-0">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2.5 rounded-t-lg bg-card border border-b-0">
        <div
          className="size-2.5 rounded-full shrink-0"
          style={{ backgroundColor: coluna.cor || "#5dca6c" }}
        />
        <span className="font-semibold text-sm flex-1 truncate">{coluna.nome}</span>

        <span
          className={cn(
            "text-xs rounded-full px-1.5 py-0.5 font-medium leading-none",
            wipExceed
              ? "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400"
              : "bg-muted text-muted-foreground"
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
        className={cn(
          "flex flex-col gap-2 flex-1 min-h-16 p-2 rounded-b-lg bg-card border transition-colors",
          isOver && "bg-muted/40 border-primary/40"
        )}
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
          <div className="flex items-center justify-center h-10 text-xs text-muted-foreground/30 select-none">
            Vazio
          </div>
        )}
      </div>
    </div>
  );
}
