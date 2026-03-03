import { useState, useMemo, useEffect, useCallback } from "react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { KPICards } from "@/components/kpi-cards";
import { Search, Plus, Users, UserPlus, UserX } from "lucide-react";
import { DialogCriar } from "./dialog-criar";
import { DialogEditar } from "./dialog-editar";
import { getClientesColumns } from "./clientes-columns";
import { clientesApi } from "@/lib/clientes.api";
import { toast } from "sonner";

const STATUS_OPTIONS = ["Todos", "Ativos", "Inativos"];

export function ClientesTable({ isAdmin = false }) {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Ativos"); // Padrão: Ativos
  const [sorting, setSorting] = useState([]);
  const [dialogCriar, setDialogCriar] = useState(false);
  const [clienteEditando, setClienteEditando] = useState(null);

  const fetchClientes = useCallback(async () => {
    try {
      const res = await clientesApi.listar();
      if (!res.ok) throw new Error();
      const data = await res.json();
      setClientes(data);
    } catch {
      toast.error("Erro ao carregar clientes.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClientes();
  }, [fetchClientes]);

  const columns = useMemo(
    () => getClientesColumns({ onEditar: setClienteEditando }),
    []
  );

  // Filtrar clientes baseado no status
  const filtered = useMemo(() => {
    let r = clientes;
    
    // Filtro de Status
    if (statusFilter === "Ativos") {
      r = r.filter((c) => c.ativo === true);
    } else if (statusFilter === "Inativos") {
      r = r.filter((c) => c.ativo === false);
    }
    // Se for "Todos", mantém todos

    // Filtro de Busca (text search)
    if (search) {
      const q = search.toLowerCase();
      r = r.filter((c) => 
        (c.nome && c.nome.toLowerCase().includes(q)) ||
        (c.sobrenome && c.sobrenome.toLowerCase().includes(q)) ||
        (c.email && c.email.toLowerCase().includes(q)) ||
        (c.cpf && c.cpf.includes(q)) ||
        (c.telefone_principal && c.telefone_principal.includes(q))
      );
    }

    return r;
  }, [clientes, search, statusFilter]);

  const table = useReactTable({
    data: filtered,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });

  // KPIs
  const totalFiltrado = filtered.length;
  
  const hoje = new Date();
  const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  
  const novosMes = useMemo(() => {
    return clientes.filter((c) => {
      if (!c.data_cadastro) return false;
      const dataCadastro = new Date(c.data_cadastro);
      return dataCadastro >= inicioMes;
    }).length;
  }, [clientes]);

  const inativos = useMemo(() => {
    return clientes.filter((c) => !c.ativo).length;
  }, [clientes]);

  const cards = [
    { 
      label: "Total de Clientes", 
      value: String(clientes.length), 
      icon: Users, 
      iconColor: "text-blue-500", 
      iconBg: "bg-blue-50 dark:bg-blue-950/40" 
    },
    { 
      label: "Resultado da Busca", 
      value: String(totalFiltrado), 
      icon: Search, 
      iconColor: "text-primary", 
      iconBg: "bg-primary/10 dark:bg-primary/20" 
    },
    { 
      label: "Novos este Mês", 
      value: String(novosMes), 
      icon: UserPlus, 
      iconColor: "text-emerald-500", 
      iconBg: "bg-emerald-50 dark:bg-emerald-950/40" 
    },
    { 
      label: "Inativos", 
      value: String(inativos), 
      icon: UserX, 
      iconColor: "text-red-500", 
      iconBg: "bg-red-50 dark:bg-red-950/40" 
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <KPICards cards={cards} />

      {/* Filtros - Estilo igual ao Financeiro */}
      <div className="rounded-lg border bg-card px-4 py-3">
        <div className="flex flex-wrap items-end gap-3">
          {/* Campo de Busca - Começa */}
          <div className="flex flex-1 flex-col gap-1 min-w-[180px]">
            <label className="text-xs text-muted-foreground">Buscar</label>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, email, documento..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-9 text-sm"
              />
            </div>
          </div>

          {/* Select de Status -紧随搜索后 */}
          <div className="flex flex-col gap-1 w-40">
            <label className="text-xs text-muted-foreground">Status</label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-9 text-sm w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Botão Novo Cliente */}
          <Button onClick={() => setDialogCriar(true)} className="h-9 gap-1.5 px-4 self-end">
            <Plus className="size-3.5" />
            Novo Cliente
          </Button>
        </div>
      </div>

      {/* Tabela */}
      <div className="rounded-lg border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-b">
              {table.getHeaderGroups().map((headerGroup) =>
                headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={`text-xs font-semibold text-foreground h-10 ${header.column.getCanSort() ? "cursor-pointer select-none" : ""}`}
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                    {header.column.getIsSorted() === "asc" ? " ↑" : header.column.getIsSorted() === "desc" ? " ↓" : ""}
                  </TableHead>
                ))
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-sm text-muted-foreground">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} className="hover:bg-muted/30 transition-colors h-14">
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="text-sm py-3">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-sm text-muted-foreground">
                  Nenhum cliente encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {totalFiltrado > 0 && (
          <div className="flex items-center justify-between border-t px-4 py-2.5 text-xs text-muted-foreground">
            <span>{totalFiltrado} registro(s) encontrado(s)</span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                Próxima
              </Button>
            </div>
          </div>
        )}
      </div>

      <DialogCriar
        open={dialogCriar}
        onClose={() => setDialogCriar(false)}
        onCreate={fetchClientes}
      />
      <DialogEditar
        open={!!clienteEditando}
        onClose={() => setClienteEditando(null)}
        cliente={clienteEditando}
        onSave={fetchClientes}
        onDelete={fetchClientes}
        isAdmin={isAdmin}
      />
    </div>
  );
}