import { Card, CardContent } from "@/components/ui/card";
import { DollarSign, AlertTriangle, CheckCircle, FileText } from "lucide-react";

function formatCurrency(value) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value ?? 0);
}

export function KPICards({ totalPendente, totalVencido, totalPagoOuRecebido, totalContas, labelPagoOuRecebido }) {
  const cards = [
    {
      label: "Total Pendente",
      value: formatCurrency(totalPendente),
      icon: DollarSign,
      iconColor: "text-amber-500",
      iconBg: "bg-amber-100 dark:bg-amber-950/40",
    },
    {
      label: "Total Vencido",
      value: formatCurrency(totalVencido),
      icon: AlertTriangle,
      iconColor: "text-red-500",
      iconBg: "bg-red-100 dark:bg-red-950/40",
    },
    {
      label: labelPagoOuRecebido,
      value: formatCurrency(totalPagoOuRecebido),
      icon: CheckCircle,
      iconColor: "text-emerald-500",
      iconBg: "bg-emerald-100 dark:bg-emerald-950/40",
    },
    {
      label: "Total de Contas",
      value: String(totalContas),
      icon: FileText,
      iconColor: "text-blue-500",
      iconBg: "bg-blue-100 dark:bg-blue-950/40",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.label}>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${card.iconBg}`}>
                <card.icon className={`size-5 ${card.iconColor}`} />
              </div>
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="text-xs font-medium text-muted-foreground truncate">{card.label}</span>
                <span className="text-lg font-semibold tabular-nums leading-tight">{card.value}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}