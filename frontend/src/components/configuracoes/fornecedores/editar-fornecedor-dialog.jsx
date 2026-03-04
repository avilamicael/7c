import { useState, useCallback, useEffect } from "react";
import { Building2, User } from "lucide-react";
import { fornecedoresApi } from "@/lib/fornecedores.api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  CamposContato, CamposEndereco, CamposBancarios, toastApiError, formatDoc,
} from "./fornecedor-form-fields";

export function EditarFornecedorDialog({ open, onClose, onSuccess, fornecedor }) {
  const [form, setForm]         = useState({});
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (!open || !fornecedor) return;
    setForm({
      nome_fantasia:       fornecedor.nome_fantasia       ?? "",
      ie:                  fornecedor.ie                  ?? "",
      rg:                  fornecedor.rg                  ?? "",
      email:               fornecedor.email               ?? "",
      telefone:            fornecedor.telefone            ?? "",
      telefone_secundario: fornecedor.telefone_secundario ?? "",
      site:                fornecedor.site                ?? "",
      cep:                 fornecedor.cep                 ?? "",
      logradouro:          fornecedor.logradouro          ?? "",
      numero:              fornecedor.numero              ?? "",
      complemento:         fornecedor.complemento         ?? "",
      bairro:              fornecedor.bairro              ?? "",
      cidade:              fornecedor.cidade              ?? "",
      estado:              fornecedor.estado              ?? "",
      pais:                fornecedor.pais                ?? "BR",
      banco_nome:          fornecedor.banco_nome          ?? "",
      banco_agencia:       fornecedor.banco_agencia       ?? "",
      banco_conta:         fornecedor.banco_conta         ?? "",
      banco_pix:           fornecedor.banco_pix           ?? "",
      observacoes:         fornecedor.observacoes         ?? "",
    });
  }, [fornecedor, open]);

  const set = useCallback((field, value) => setForm((p) => ({ ...p, [field]: value })), []);

  async function handleSalvar() {
    const payload = {
      ...form,
      telefone:            (form.telefone            ?? "").replace(/\D/g, ""),
      telefone_secundario: (form.telefone_secundario ?? "").replace(/\D/g, ""),
      cep:                 (form.cep                 ?? "").replace(/\D/g, ""),
    };

    setSalvando(true);
    try {
      await fornecedoresApi.editar(fornecedor.public_id, payload);
      onSuccess?.();
      onClose();
      setTimeout(() => {
        import("sonner").then(({ toast }) => toast.success("Fornecedor atualizado."));
      }, 100);
    } catch (err) {
      toastApiError(err);
    } finally {
      setSalvando(false);
    }
  }

  if (!fornecedor) return null;

  const isPJ = fornecedor.tipo_pessoa === "PJ";

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="!max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {fornecedor.razao_social}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-2">

          {/* Identificação */}
          <div>
            <p className="text-sm font-semibold mb-3 border-b pb-1">Identificação</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>{isPJ ? "Nome Fantasia" : "Apelido"}</Label>
                <Input
                  value={form.nome_fantasia ?? ""}
                  onChange={(e) => set("nome_fantasia", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>{isPJ ? "Inscrição Estadual" : "RG"}</Label>
                <Input
                  value={isPJ ? (form.ie ?? "") : (form.rg ?? "")}
                  onChange={(e) => set(isPJ ? "ie" : "rg", e.target.value)}
                  placeholder="Opcional"
                />
              </div>
              <div className="space-y-1.5">
                <Label>{isPJ ? "CNPJ" : "CPF"}</Label>
                <Input
                  value={formatDoc(fornecedor)}
                  disabled
                  className="bg-muted text-muted-foreground"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Tipo</Label>
                <div className="flex items-center gap-2 h-9 px-3 rounded-md border bg-muted text-muted-foreground text-sm">
                  {isPJ
                    ? <><Building2 className="size-4" /> Pessoa Jurídica</>
                    : <><User      className="size-4" /> Pessoa Física</>}
                </div>
              </div>
            </div>
          </div>

          {/* Contato */}
          <div>
            <p className="text-sm font-semibold mb-3 border-b pb-1">Contato</p>
            <CamposContato form={form} set={set} />
          </div>

          {/* Endereço */}
          <div>
            <p className="text-sm font-semibold mb-3 border-b pb-1">Endereço</p>
            <CamposEndereco form={form} set={set} />
          </div>

          {/* Dados Bancários */}
          <div>
            <p className="text-sm font-semibold mb-3 border-b pb-1">Dados Bancários</p>
            <CamposBancarios form={form} set={set} />
          </div>
        </div>

        <DialogFooter className="mt-2">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSalvar} disabled={salvando}>
            {salvando ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}