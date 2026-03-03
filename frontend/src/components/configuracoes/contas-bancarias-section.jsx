import { useState, useEffect, useCallback } from "react";
import { contasBancariasApi } from "@/lib/financeiro.api";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Landmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const TIPOS = [
  { value: "CC", label: "Conta Corrente" },
  { value: "CP", label: "Conta Poupança" },
  { value: "PI", label: "Conta PIX" },
  { value: "CX", label: "Caixa" },
];

const TIPO_LABEL = Object.fromEntries(TIPOS.map((t) => [t.value, t.label]));

const emptyForm = { banco_nome: "", agencia: "", conta: "", tipo: "CC", descricao: "" };

function ContaBancariaDialog({ open, onClose, onSuccess, conta }) {
  const [form, setForm] = useState(emptyForm);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    setForm(
      conta
        ? { banco_nome: conta.banco_nome, agencia: conta.agencia ?? "", conta: conta.conta ?? "", tipo: conta.tipo, descricao: conta.descricao ?? "" }
        : emptyForm
    );
  }, [conta, open]);

  const set = (field, value) => setForm((p) => ({ ...p, [field]: value }));

  async function handleSalvar() {
    if (!form.banco_nome.trim()) { toast.error("Nome do banco é obrigatório."); return; }
    setSalvando(true);
    try {
      if (conta) {
        await contasBancariasApi.editar(conta.id, form);
        toast.success("Conta bancária atualizada.");
      } else {
        await contasBancariasApi.criar(form);
        toast.success("Conta bancária criada.");
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
          <DialogTitle>{conta ? "Editar Conta Bancária" : "Nova Conta Bancária"}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-2">
            <Label>Banco <span className="text-destructive">*</span></Label>
            <Input value={form.banco_nome} onChange={(e) => set("banco_nome", e.target.value)} placeholder="Ex: Bradesco" />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Tipo</Label>
            <Select value={form.tipo} onValueChange={(v) => set("tipo", v)}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {TIPOS.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label>Agência</Label>
              <Input value={form.agencia} onChange={(e) => set("agencia", e.target.value)} placeholder="0001" />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Conta</Label>
              <Input value={form.conta} onChange={(e) => set("conta", e.target.value)} placeholder="12345-6" />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label>Descrição</Label>
            <Input value={form.descricao} onChange={(e) => set("descricao", e.target.value)} placeholder="Opcional" />
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

export function ContasBancariasSection() {
  const [contas, setContas]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [dialog, setDialog]         = useState({ open: false, conta: null });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deletando, setDeletando]   = useState(false);

  const fetch = useCallback(() => {
    setLoading(true);
    contasBancariasApi.listar()
      .then((data) => setContas(Array.isArray(data) ? data : []))
      .catch(() => toast.error("Erro ao carregar contas bancárias."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeletando(true);
    try {
      await contasBancariasApi.excluir(deleteTarget.id);
      toast.success("Conta removida.");
      fetch();
    } catch {
      toast.error("Erro ao remover conta.");
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
              <Landmark className="size-5 text-muted-foreground" />
              <div>
                <CardTitle className="text-base">Contas Bancárias</CardTitle>
                <CardDescription>Contas usadas para registrar pagamentos e recebimentos.</CardDescription>
              </div>
            </div>
            <Button size="sm" className="gap-1.5" onClick={() => setDialog({ open: true, conta: null })}>
              <Plus className="size-3.5" />Nova
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex flex-col gap-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-12 rounded-md bg-muted animate-pulse" />
              ))}
            </div>
          ) : contas.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              Nenhuma conta bancária cadastrada.
            </p>
          ) : (
            <div className="flex flex-col divide-y rounded-md border overflow-hidden">
              {contas.map((c) => (
                <div key={c.id} className="flex items-center justify-between px-4 py-3 bg-card">
                  <div>
                    <p className="text-sm font-medium">{c.banco_nome}</p>
                    <p className="text-xs text-muted-foreground">
                      {TIPO_LABEL[c.tipo] ?? c.tipo}
                      {c.agencia && ` · Ag: ${c.agencia}`}
                      {c.conta && ` · Cc: ${c.conta}`}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-foreground"
                      onClick={() => setDialog({ open: true, conta: c })}
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-destructive"
                      onClick={() => setDeleteTarget(c)}
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

      <ContaBancariaDialog
        open={dialog.open}
        conta={dialog.conta}
        onClose={() => setDialog({ open: false, conta: null })}
        onSuccess={fetch}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover conta bancária?</AlertDialogTitle>
            <AlertDialogDescription>
              A conta <strong>{deleteTarget?.banco_nome}</strong> será removida permanentemente.
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