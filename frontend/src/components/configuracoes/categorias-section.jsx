import { useState, useEffect, useCallback } from "react";
import { categoriasApi } from "@/lib/financeiro.api";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Tags } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

const emptyForm = { nome: "", descricao: "" };

function CategoriaDialog({ open, onClose, onSuccess, categoria }) {
  const [form, setForm] = useState(emptyForm);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    setForm(categoria ? { nome: categoria.nome, descricao: categoria.descricao ?? "" } : emptyForm);
  }, [categoria, open]);

  async function handleSalvar() {
    if (!form.nome.trim()) { toast.error("Nome é obrigatório."); return; }
    setSalvando(true);
    try {
      if (categoria) {
        await categoriasApi.editar(categoria.id, form);
        toast.success("Categoria atualizada.");
      } else {
        await categoriasApi.criar(form);
        toast.success("Categoria criada.");
      }
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(Object.values(err || {}).flat()[0] ?? "Erro ao salvar.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{categoria ? "Editar Categoria" : "Nova Categoria"}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-2">
            <Label>Nome <span className="text-destructive">*</span></Label>
            <Input
              value={form.nome}
              onChange={(e) => setForm((p) => ({ ...p, nome: e.target.value }))}
              placeholder="Ex: Despesas Operacionais"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Descrição</Label>
            <Input
              value={form.descricao}
              onChange={(e) => setForm((p) => ({ ...p, descricao: e.target.value }))}
              placeholder="Opcional"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSalvar} disabled={salvando}>
            {salvando ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function CategoriasSection() {
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [dialog, setDialog]         = useState({ open: false, categoria: null });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deletando, setDeletando]   = useState(false);

  const fetch = useCallback(() => {
    setLoading(true);
    categoriasApi.listar()
      .then((data) => setCategorias(Array.isArray(data) ? data : []))
      .catch(() => toast.error("Erro ao carregar categorias."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeletando(true);
    try {
      await categoriasApi.excluir(deleteTarget.id);
      toast.success("Categoria removida.");
      fetch();
    } catch {
      toast.error("Erro ao remover categoria.");
    } finally {
      setDeletando(false);
      setDeleteTarget(null);
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Tags className="size-5 text-muted-foreground" />
              <div>
                <CardTitle className="text-base">Categorias</CardTitle>
                <CardDescription>Categorias usadas para classificar contas a pagar e a receber.</CardDescription>
              </div>
            </div>
            <Button size="sm" className="gap-1.5" onClick={() => setDialog({ open: true, categoria: null })}>
              <Plus className="size-3.5" />Nova
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex flex-col gap-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-10 rounded-md bg-muted animate-pulse" />
              ))}
            </div>
          ) : categorias.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              Nenhuma categoria cadastrada.
            </p>
          ) : (
            <div className="flex flex-col divide-y rounded-md border overflow-hidden">
              {categorias.map((cat) => (
                <div
                  key={cat.id}
                  className={cn(
                    "flex items-center justify-between px-4 py-3 text-sm bg-card",
                    !cat.ativo && "opacity-50"
                  )}
                >
                  <div>
                    <p className="font-medium">{cat.nome}</p>
                    {cat.descricao && (
                      <p className="text-xs text-muted-foreground">{cat.descricao}</p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-foreground"
                      onClick={() => setDialog({ open: true, categoria: cat })}
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-destructive"
                      onClick={() => setDeleteTarget(cat)}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <CategoriaDialog
        open={dialog.open}
        categoria={dialog.categoria}
        onClose={() => setDialog({ open: false, categoria: null })}
        onSuccess={fetch}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover categoria?</AlertDialogTitle>
            <AlertDialogDescription>
              A categoria <strong>{deleteTarget?.nome}</strong> será removida permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deletando}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletando ? "Removendo..." : "Remover"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}