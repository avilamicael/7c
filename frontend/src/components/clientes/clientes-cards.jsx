import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Search, UserPlus, UserX } from "lucide-react";

export function ClientesCards({ clientes, totalFiltrado }) {
  const hoje = new Date();
  const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);

  const totalClientes = clientes.length;
  const inativos = clientes.filter((c) => !c.ativo).length;
  const novosMes = clientes.filter((c) => {
    const dataCadastro = new Date(c.data_cadastro);
    return dataCadastro >= inicioMes;
  }).length;

  const cards = [
    {
      title: "Total de Clientes",
      value: totalClientes,
      icon: Users,
      description: "clientes cadastrados",
    },
    {
      title: "Resultado da Busca",
      value: totalFiltrado,
      icon: Search,
      description: "clientes encontrados",
    },
    {
      title: "Novos este Mês",
      value: novosMes,
      icon: UserPlus,
      description: "cadastros no mês atual",
    },
    {
      title: "Inativos",
      value: inativos,
      icon: UserX,
      description: "clientes inativos",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {card.title}
            </CardTitle>
            <card.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value}</div>
            <p className="text-xs text-muted-foreground mt-1">{card.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
