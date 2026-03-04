import { useState, useEffect, useCallback } from "react";
import { fornecedoresApi } from "@/lib/fornecedores.api";
import { toast } from "sonner";
import { Plus, Pencil, Power, Building2, User, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { CriarFornecedorDialog }  from "./criar-fornecedor-dialog";
import { EditarFornecedorDialog } from "./editar-fornecedor-dialog";
import { formatDoc } from "./fornecedor-form-fields";

const MIN_SEARCH_LENGTH = 3;

export function FornecedoresSection() {
  const [fornecedores, setFornecedores] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState("");
  const [criarOpen, setCriarOpen]       = useState(false);
  const [editTarget, setEditTarget]     = useState(null);
  const [toggleTarget, setToggleTarget] = useState(null);
  const [toggling, setToggling]         = useState(false);

  const fetchFornecedores = useCallback((term) => {
    setLoading(true);
    fornecedoresApi
      .listar(term)
      .then((data) => setFornecedores(Array.isArray(data) ? data : []))
      .catch(() => toast.error("Erro ao carregar fornecedores."))
      .finally(() => setLoading(false));
  }, []);

  // Busca inicial (sem filtro) + re-busca quando search atinge mínimo ou é apagado
  useEffect(() => {
    if (search === "" || search.length >= MIN_SEARCH_LENGTH) {
      const t = setTimeout(() => fetchFornecedores(search), 300);
      return () => clearTimeout(t);
    }
  }, [search, fetchFornecedores]);

  async function handleToggleAtivo() {
    if (!toggleTarget) return;
    setToggling(true);
    try {
      await fornecedoresApi.editar(toggleTarget.public_id, { ativo: !toggleTarget.ativo });
      toast.success(toggleTarget.ativo ? "Fornecedor inativado." : "Fornecedor reativado.");
      fetchFornecedores(search.length >= MIN_SEARCH_LENGTH ? search : "");
    } catch {
      toast.error("Erro ao alterar status.");
    } finally {
      setToggling(false);
      setToggleTarget(null);
    }
  }

  const searchHint = search.length > 0 && search.length < MIN_SEARCH_LENGTH;

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>Fornecedores</CardTitle>
          <CardDescription>
            Gerencie os fornecedores da empresa (Pessoa Física ou Jurídica).
          </CardDescription>
        </div>
        <Button size="sm" onClick={() => setCriarOpen(true)}>
          <Plus className="size-4 mr-1" />
          Novo Fornecedor
        </Button>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Buscar por nome, CNPJ ou CPF..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {searchHint && (
            <p className="text-xs text-muted-foreground pl-1">
              Digite ao menos {MIN_SEARCH_LENGTH} caracteres para buscar.
            </p>
          )}
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground py-6 text-center">Carregando...</p>
        ) : fornecedores.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">
            Nenhum fornecedor encontrado.
          </p>
        ) : (
          <div className="divide-y rounded-md border">
            {fornecedores.map((f) => (
              <div
                key={f.public_id}
                className={cn(
                  "flex items-center justify-between gap-4 px-4 py-3",
                  !f.ativo && "opacity-50"
                )}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted">
                    {f.tipo_pessoa === "PJ"
                      ? <Building2 className="size-4 text-muted-foreground" />
                      : <User      className="size-4 text-muted-foreground" />}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium leading-tight">{f.razao_social}</p>
                    <p className="text-xs text-muted-foreground">
                      {f.nome_fantasia ? `${f.nome_fantasia} · ` : ""}
                      {formatDoc(f)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Badge
                    variant={f.ativo ? "default" : "secondary"}
                    className="text-xs hidden sm:inline-flex"
                  >
                    {f.ativo ? "Ativo" : "Inativo"}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setEditTarget(f)}
                    title="Editar"
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setToggleTarget(f)}
                    title={f.ativo ? "Inativar" : "Reativar"}
                  >
                    <Power className={cn("size-4", f.ativo ? "text-destructive" : "text-green-600")} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <CriarFornecedorDialog
        open={criarOpen}
        onClose={() => setCriarOpen(false)}
        onSuccess={() => fetchFornecedores(search.length >= MIN_SEARCH_LENGTH ? search : "")}
      />

      <EditarFornecedorDialog
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
        onSuccess={() => fetchFornecedores(search.length >= MIN_SEARCH_LENGTH ? search : "")}
        fornecedor={editTarget}
      />

      <AlertDialog open={!!toggleTarget} onOpenChange={(o) => !o && setToggleTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {toggleTarget?.ativo ? "Inativar fornecedor?" : "Reativar fornecedor?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {toggleTarget?.ativo
                ? "O fornecedor não aparecerá nas seleções enquanto inativo."
                : "O fornecedor voltará a aparecer nas seleções."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={toggling}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleToggleAtivo} disabled={toggling}>
              {toggling ? "Aguarde..." : "Confirmar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}