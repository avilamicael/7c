import { useState, useCallback, useEffect } from "react";
import { Building2, User } from "lucide-react";
import { toast } from "sonner";
import { fornecedoresApi } from "@/lib/fornecedores.api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  CamposContato, CamposEndereco, CamposBancarios, sanitizePayload, toastApiError,
} from "./fornecedor-form-fields";

const EMPTY_FORM = {
  tipo_pessoa: "PJ",
  razao_social: "", nome_fantasia: "",
  cnpj: "", ie: "", cpf: "", rg: "",
  email: "", telefone: "", telefone_secundario: "", site: "",
  cep: "", logradouro: "", numero: "", complemento: "",
  bairro: "", cidade: "", estado: "", pais: "BR",
  banco_nome: "", banco_agencia: "", banco_conta: "", banco_pix: "",
  observacoes: "",
};

export function CriarFornecedorDialog({ open, onClose, onSuccess }) {
  const [form, setForm]         = useState(EMPTY_FORM);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => { if (open) setForm(EMPTY_FORM); }, [open]);

  const set = useCallback((field, value) => setForm((p) => ({ ...p, [field]: value })), []);

  async function handleSalvar() {
    if (!form.razao_social.trim()) {
      toast.error("Razão social / Nome é obrigatório.");
      return;
    }
    const payload = sanitizePayload({ ...form });
    if (payload.tipo_pessoa === "PJ") { payload.cpf = ""; payload.rg = ""; }
    else                              { payload.cnpj = ""; payload.ie = ""; }

    setSalvando(true);
    try {
      await fornecedoresApi.criar(payload);
      toast.success("Fornecedor cadastrado.");
      onSuccess?.();
      onClose();
    } catch (err) {
      toastApiError(err);
    } finally {
      setSalvando(false);
    }
  }

  const isPJ = form.tipo_pessoa === "PJ";

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="!max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Fornecedor</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-2">

          {/* Tipo de pessoa */}
          <div className="flex gap-3">
            {[
              { id: "PJ", label: "Pessoa Jurídica", Icon: Building2 },
              { id: "PF", label: "Pessoa Física",   Icon: User },
            ].map(({ id, label, Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => set("tipo_pessoa", id)}
                className={cn(
                  "flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-all",
                  form.tipo_pessoa === id
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:bg-muted"
                )}
              >
                <Icon className="size-4" />
                {label}
              </button>
            ))}
          </div>

          {/* Identificação */}
          <div>
            <p className="text-sm font-semibold mb-3 border-b pb-1">Identificação</p>
            {isPJ ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Razão Social <span className="text-destructive">*</span></Label>
                  <Input
                    value={form.razao_social}
                    onChange={(e) => set("razao_social", e.target.value)}
                    placeholder="Empresa LTDA"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Nome Fantasia</Label>
                  <Input value={form.nome_fantasia} onChange={(e) => set("nome_fantasia", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>CNPJ <span className="text-destructive">*</span></Label>
                  <Input
                    value={form.cnpj}
                    onChange={(e) => set("cnpj", e.target.value)}
                    placeholder="00.000.000/0000-00"
                    maxLength={18}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Inscrição Estadual</Label>
                  <Input value={form.ie} onChange={(e) => set("ie", e.target.value)} placeholder="Opcional" />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Nome Completo <span className="text-destructive">*</span></Label>
                  <Input
                    value={form.razao_social}
                    onChange={(e) => set("razao_social", e.target.value)}
                    placeholder="João da Silva"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Apelido</Label>
                  <Input value={form.nome_fantasia} onChange={(e) => set("nome_fantasia", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>CPF <span className="text-destructive">*</span></Label>
                  <Input
                    value={form.cpf}
                    onChange={(e) => set("cpf", e.target.value)}
                    placeholder="000.000.000-00"
                    maxLength={14}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>RG</Label>
                  <Input value={form.rg} onChange={(e) => set("rg", e.target.value)} placeholder="Opcional" />
                </div>
              </div>
            )}
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
            {salvando ? "Salvando..." : "Cadastrar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}