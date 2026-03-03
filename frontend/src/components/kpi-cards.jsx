import { Card, CardContent } from "@/components/ui/card";

export function KPICards({ cards = [] }) {
  const gridCols = {
    1: "grid-cols-1",
    2: "grid-cols-2",
    3: "grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-2 lg:grid-cols-4",
    6: "grid-cols-2 lg:grid-cols-3",
  }[cards.length] ?? "grid-cols-2 lg:grid-cols-4";

  return (
    <div className={`grid gap-3 ${gridCols}`}>
      {cards.map((card) => (
        <Card key={card.label} className="py-0">
          <CardContent className="flex items-center gap-3 px-4 py-4">
            <div className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${card.iconBg}`}>
              <card.icon className={`size-4.5 ${card.iconColor}`} />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs text-muted-foreground leading-tight">{card.label}</span>
              <span className="font-sans text-xl font-bold tabular-nums leading-tight tracking-tight">
                {card.value}
              </span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}