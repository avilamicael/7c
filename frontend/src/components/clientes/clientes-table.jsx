import { useState, useMemo } from "react";
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

export function ClientesTable({ clientes: initialClientes, isAdmin = false }) {
  const [clientes, setClientes] = useState(initialClientes);
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState([]);
  const [dialogCriar, setDialogCriar] = useState(false);
  const [clienteEditando, setClienteEditando] = useState(null);

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

  const handleCreate = (novoCliente) => {
    setClientes((prev) => [...prev, novoCliente]);
  };

  const handleSave = (clienteAtualizado) => {
    setClientes((prev) =>
      prev.map((c) => (c.id === clienteAtualizado.id ? clienteAtualizado : c))
    );
  };

  const handleDelete = (id) => {
    setClientes((prev) => prev.filter((c) => c.id !== id));
  };

  return (
    <div className="space-y-4">
      {/* Cards */}
      <ClientesCards clientes={clientes} totalFiltrado={totalFiltrado} />

      {/* Header */}
      <div className="flex items-center justify-between">
        <Input
          placeholder="Buscar por nome, email, documento..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="max-w-sm"
        />
        <Button onClick={() => setDialogCriar(true)}>+ Novo Cliente</Button>
      </div>

      {/* Table */}
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
                    {header.column.getIsSorted() === "asc"
                      ? " ↑"
                      : header.column.getIsSorted() === "desc"
                      ? " ↓"
                      : ""}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
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
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  Nenhum cliente encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Página {table.getState().pagination.pageIndex + 1} de {table.getPageCount()}
        </span>
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

      {/* Dialogs */}
      <DialogCriar
        open={dialogCriar}
        onClose={() => setDialogCriar(false)}
        onCreate={handleCreate}
      />
      <DialogEditar
        open={!!clienteEditando}
        onClose={() => setClienteEditando(null)}
        cliente={clienteEditando}
        onSave={handleSave}
        onDelete={handleDelete}
        isAdmin={isAdmin}
      />
    </div>
  );
}
