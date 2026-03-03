import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Step1, Step2, Step3 } from "./clientes-form-steps";
import { clientesApi } from "@/lib/clientes.api";
import { toast } from "sonner";

const FALLBACK_FORM = {
  documentos: [{ id: Date.now(), tipo: "cpf", numero: "" }],
  telefones: [{ id: Date.now() + 1, tipo: "proprio", nome: "", numero: "" }],
};

export function DialogEditar({ open, onClose, cliente, onSave, onDelete, isAdmin }) {
  const [form, setForm] = useState(null);
  const [carregando, setCarregando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [inativando, setInativando] = useState(false);

  useEffect(() => {
    if (!cliente || !open) return;

    async function fetchDetalhe() {
      setCarregando(true);
      try {
        const res = await clientesApi.detalhar(cliente.public_id);
        if (!res.ok) throw new Error();
        const data = await res.json();
        setForm({
          ...data,
          documentos: data.documentos?.length ? data.documentos : FALLBACK_FORM.documentos,
          telefones: data.telefones?.length ? data.telefones : FALLBACK_FORM.telefones,
        });
      } catch {
        toast.error("Erro ao carregar dados do cliente.");
        onClose();
      } finally {
        setCarregando(false);
      }
    }

    fetchDetalhe();
  }, [cliente, open]);

  const handleChange = (field, value) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    setSalvando(true);
    try {
      const atualizado = await clientesApi.editar(cliente.public_id, {
        nome: form.nome,
        sobrenome: form.sobrenome,
        data_nascimento: form.data_nascimento || null,
        nacionalidade: form.nacionalidade,
        passaporte: form.passaporte,
        passaporte_emissao: form.passaporte_emissao || null,
        passaporte_expiracao: form.passaporte_expiracao || null,
        passaporte_pais: form.passaporte_pais,
        email: form.email,
        rede_social: form.rede_social,
        observacoes: form.observacoes,
        documentos: form.documentos,
        telefones: form.telefones,
      });
      onSave(atualizado);
      onClose();
      toast.success("Cliente atualizado com sucesso.");
    } catch (err) {
      toast.error(err?.detail ?? "Erro ao atualizar cliente.");
    } finally {
      setSalvando(false);
    }
  };

  const handleInativar = async () => {
    setInativando(true);
    try {
      const resultado = await clientesApi.inativar(cliente.public_id);
      onSave({ ...cliente, ativo: resultado.ativo });
      onClose();
      toast.success(resultado.ativo ? "Cliente reativado." : "Cliente inativado.");
    } catch (err) {
      toast.error(err?.detail ?? "Erro ao inativar cliente.");
    } finally {
      setInativando(false);
    }
  };

  if (!cliente) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="!max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {cliente.nome} {cliente.sobrenome}
          </DialogTitle>
        </DialogHeader>

        {carregando || !form ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            Carregando dados do cliente...
          </div>
        ) : (
          <>
            <div className="space-y-6 py-2">
              <div>
                <p className="text-sm font-semibold mb-3 border-b pb-1">Dados Pessoais</p>
                <Step1 form={form} onChange={handleChange} />
              </div>
              <div>
                <p className="text-sm font-semibold mb-3 border-b pb-1">Documentos</p>
                <Step2 form={form} onChange={handleChange} />
              </div>
              <div>
                <p className="text-sm font-semibold mb-3 border-b pb-1">Contato</p>
                <Step3 form={form} onChange={handleChange} />
              </div>
            </div>

            <DialogFooter className="flex justify-between mt-2">
              {isAdmin && (
                <Button
                  variant="outline"
                  className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                  onClick={handleInativar}
                  disabled={inativando || salvando}
                >
                  {inativando ? "Aguarde..." : cliente.ativo ? "Inativar Cliente" : "Reativar Cliente"}
                </Button>
              )}
              <div className="flex gap-2 ml-auto">
                <Button variant="outline" onClick={onClose} disabled={salvando || inativando}>
                  Cancelar
                </Button>
                <Button onClick={handleSave} disabled={salvando || inativando}>
                  {salvando ? "Salvando..." : "Salvar Alterações"}
                </Button>
              </div>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}