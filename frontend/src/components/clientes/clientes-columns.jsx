import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const getCPF = (cliente) =>
  cliente.documentos?.find((d) => d.tipo === "cpf")?.numero ?? "—";

const getTelefonePrincipal = (cliente) =>
  cliente.telefones?.find((t) => t.tipo === "proprio")?.numero ?? "—";

const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  const [year, month, day] = dateStr.split("-");
  return `${day}/${month}/${year}`;
};

export const getClientesColumns = ({ onEditar }) => [
  {
    id: "nome_completo",
    header: "Nome Completo",
    accessorFn: (row) => `${row.nome} ${row.sobrenome}`,
    cell: ({ row }) => (
      <div className="font-medium">
        {row.original.nome} {row.original.sobrenome}
      </div>
    ),
  },
  {
    id: "data_nascimento",
    header: "Nascimento",
    accessorFn: (row) => row.data_nascimento,
    cell: ({ row }) => (
      <div className="text-sm">{formatDate(row.original.data_nascimento)}</div>
    ),
  },
  {
    id: "contato",
    header: "Contato",
    cell: ({ row }) => (
      <div className="text-sm">
        <div>{getTelefonePrincipal(row.original)}</div>
        <div className="text-muted-foreground">{row.original.email || "—"}</div>
      </div>
    ),
  },
  {
    id: "documento",
    header: "Documento",
    cell: ({ row }) => (
      <div className="text-sm">
        <div>{getCPF(row.original)}</div>
        <div className="text-muted-foreground">
          {row.original.passaporte ? `🛂 ${row.original.passaporte}` : "—"}
        </div>
      </div>
    ),
  },
  {
    id: "status",
    header: "Status",
    cell: ({ row }) => (
      <Badge variant={row.original.ativo ? "default" : "secondary"}>
        {row.original.ativo ? "Ativo" : "Inativo"}
      </Badge>
    ),
  },
  {
    id: "acoes",
    header: "",
    cell: ({ row }) => (
      <Button variant="outline" size="sm" onClick={() => onEditar(row.original)}>
        Editar
      </Button>
    ),
  },
];
