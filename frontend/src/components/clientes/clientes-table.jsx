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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ClientesCards } from "./clientes-cards";
import { DialogCriar } from "./dialog-criar";
import { DialogEditar } from "./dialog-editar";
import { getClientesColumns } from "./clientes-columns";
import { clientesApi } from "@/lib/clientes.api";
import { toast } from "sonner";

export function ClientesTable({ isAdmin = false }) {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [globalFilter, setGlobalFilter] = useState("");
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

  const table = useReactTable({
    data: clientes,
    columns,
    state: { globalFilter, sorting },
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });

  const totalFiltrado = table.getFilteredRowModel().rows.length;

  return (
    <div className="space-y-4">
      <ClientesCards clientes={clientes} totalFiltrado={totalFiltrado} />

      <div className="flex items-center justify-between">
        <Input
          placeholder="Buscar por nome, email, documento..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="max-w-sm"
        />
        <Button onClick={() => setDialogCriar(true)}>+ Novo Cliente</Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={header.column.getCanSort() ? "cursor-pointer select-none" : ""}
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                    {header.column.getIsSorted() === "asc" ? " ↑" : header.column.getIsSorted() === "desc" ? " ↓" : ""}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center py-8 text-muted-foreground">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center py-8 text-muted-foreground">
                  Nenhum cliente encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          Página {table.getState().pagination.pageIndex + 1} de {table.getPageCount()}
        </span>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
            Anterior
          </Button>
          <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
            Próxima
          </Button>
        </div>
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