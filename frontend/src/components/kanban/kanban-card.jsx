import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import { Calendar, Link2, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/ui/user-avatar";

const PRIORIDADE_BAR = {
  URGENTE: "bg-red-500",
  ALTA:    "bg-orange-500",
  MEDIA:   "bg-sky-500",
  BAIXA:   "bg-slate-400",
};

function isVencido(data_vencimento) {
  if (!data_vencimento) return false;
  return new Date(data_vencimento + "T00:00:00") < new Date(new Date().toDateString());
}

function formatData(data) {
  if (!data) return null;
  return new Date(data + "T00:00:00").toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  });
}


export function KanbanCard({ card, isOverlay = false, onEdit, onArchive }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.public_id });

  const style = isOverlay
    ? { transform: "rotate(1.5deg)" }
    : { transform: CSS.Transform.toString(transform), transition };

  const vencido = isVencido(card.data_vencimento);

  return (
    <div
      ref={isOverlay ? undefined : setNodeRef}
      style={style}
      {...(isOverlay ? {} : { ...attributes, ...listeners })}
      className={cn(
        "group flex gap-2 bg-background border rounded-lg px-3 py-2.5",
        "cursor-grab active:cursor-grabbing select-none",
        "hover:shadow-sm transition-all",
        isDragging && "opacity-25",
        isOverlay && "shadow-2xl ring-1 ring-primary/20 opacity-100"
      )}
    >
      {/* Barra de prioridade */}
      <div
        className={cn(
          "w-1 self-stretch rounded-full shrink-0",
          PRIORIDADE_BAR[card.prioridade] ?? "bg-slate-400"
        )}
      />

      {/* Conteúdo */}
      <div className="flex flex-col gap-1.5 flex-1 min-w-0">
        <span className="text-sm font-medium leading-snug line-clamp-2 break-words">
          {card.titulo}
        </span>

        {card.descricao && (
          <span className="text-xs text-muted-foreground line-clamp-2 break-words">
            {card.descricao}
          </span>
        )}

        {/* Footer */}
        <div className="flex items-center gap-2 flex-wrap mt-0.5">
          {card.responsavel_public_id && (
            <UserAvatar nome={card.responsavel_nome} />
          )}

          {card.data_vencimento && (
            <span
              className={cn(
                "flex items-center gap-0.5 text-[11px]",
                vencido
                  ? "text-red-600 dark:text-red-400 font-medium"
                  : "text-muted-foreground"
              )}
            >
              <Calendar className="size-3" />
              {formatData(card.data_vencimento)}
            </span>
          )}

          {card.tarefa_public_id && (
            <Link2
              className="size-3 text-blue-500 ml-auto"
              title={card.tarefa_titulo ?? "Tarefa vinculada"}
            />
          )}
        </div>
      </div>

      {/* Menu */}
      {!isOverlay && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-6 shrink-0 self-start opacity-0 group-hover:opacity-100 transition-opacity"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="size-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEdit}>Editar</DropdownMenuItem>
            <DropdownMenuItem
              onClick={onArchive}
              className="text-destructive focus:text-destructive"
            >
              Arquivar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
