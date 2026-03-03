import { Card, CardContent } from "@/components/ui/card";
import { Users, Search, UserPlus, UserX } from "lucide-react";

export function ClientesCards({ clientes, totalFiltrado }) {
  const hoje = new Date();
  const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);

  const totalClientes = clientes.length;
  const inativos = clientes.filter((c) => !c.ativo).length;
  const novosMes = clientes.filter((c) => new Date(c.data_cadastro) >= inicioMes).length;

  const cards = [
    {
      label: "Total de Clientes",
      value: String(totalClientes),
      icon: Users,
      iconColor: "text-blue-500",
      iconBg: "bg-blue-50 dark:bg-blue-950/40",
    },
    {
      label: "Resultado da Busca",
      value: String(totalFiltrado),
      icon: Search,
      iconColor: "text-primary",
      iconBg: "bg-primary/10 dark:bg-primary/20",
    },
    {
      label: "Novos este Mês",
      value: String(novosMes),
      icon: UserPlus,
      iconColor: "text-emerald-500",
      iconBg: "bg-emerald-50 dark:bg-emerald-950/40",
    },
    {
      label: "Inativos",
      value: String(inativos),
      icon: UserX,
      iconColor: "text-red-500",
      iconBg: "bg-red-50 dark:bg-red-950/40",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
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