import { useState, useCallback } from "react";
import { toast } from "sonner";
import { buscarCep } from "@/lib/cep.api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

export const ESTADOS = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG",
  "PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO",
];

export function CamposContato({ form, set }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-1.5">
        <Label>E-mail</Label>
        <Input
          type="email"
          value={form.email ?? ""}
          onChange={(e) => set("email", e.target.value)}
          placeholder="contato@empresa.com"
        />
      </div>
      <div className="space-y-1.5">
        <Label>Site</Label>
        <Input
          value={form.site ?? ""}
          onChange={(e) => set("site", e.target.value)}
          placeholder="https://..."
        />
      </div>
      <div className="space-y-1.5">
        <Label>Telefone</Label>
        <Input
          value={form.telefone ?? ""}
          onChange={(e) => set("telefone", e.target.value)}
          placeholder="DDD + número"
          maxLength={11}
        />
      </div>
      <div className="space-y-1.5">
        <Label>Telefone Secundário</Label>
        <Input
          value={form.telefone_secundario ?? ""}
          onChange={(e) => set("telefone_secundario", e.target.value)}
          placeholder="DDD + número"
          maxLength={11}
        />
      </div>
      <div className="space-y-1.5 col-span-2">
        <Label>Observações</Label>
        <textarea
          className="flex min-h-[72px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
          value={form.observacoes ?? ""}
          onChange={(e) => set("observacoes", e.target.value)}
          placeholder="Anotações internas..."
        />
      </div>
    </div>
  );
}

export function CamposEndereco({ form, set }) {
  const [buscandoCep, setBuscandoCep] = useState(false);

  const handleBuscarCep = useCallback(async (cep) => {
    const soDigitos = (cep ?? "").replace(/\D/g, "");
    if (soDigitos.length !== 8) return;
    setBuscandoCep(true);
    try {
      const dados = await buscarCep(soDigitos);
      set("logradouro", dados.logradouro || "");
      set("bairro",     dados.bairro     || "");
      set("cidade",     dados.cidade     || "");
      set("estado",     dados.uf         || "");
    } catch {
      toast.error("CEP não encontrado.");
    } finally {
      setBuscandoCep(false);
    }
  }, [set]);

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-1.5">
        <Label>CEP</Label>
        <div className="flex gap-2">
          <Input
            value={form.cep ?? ""}
            onChange={(e) => set("cep", e.target.value.replace(/\D/g, ""))}
            onBlur={(e) => handleBuscarCep(e.target.value)}
            placeholder="00000000"
            maxLength={8}
          />
          <Button
            type="button"
            variant="outline"
            className="shrink-0"
            disabled={buscandoCep || (form.cep ?? "").replace(/\D/g, "").length !== 8}
            onClick={() => handleBuscarCep(form.cep)}
          >
            {buscandoCep ? "Buscando..." : "Buscar"}
          </Button>
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Logradouro</Label>
        <Input value={form.logradouro ?? ""} onChange={(e) => set("logradouro", e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label>Número</Label>
        <Input value={form.numero ?? ""} onChange={(e) => set("numero", e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label>Complemento</Label>
        <Input value={form.complemento ?? ""} onChange={(e) => set("complemento", e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label>Bairro</Label>
        <Input value={form.bairro ?? ""} onChange={(e) => set("bairro", e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label>Cidade</Label>
        <Input value={form.cidade ?? ""} onChange={(e) => set("cidade", e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label>Estado</Label>
        <Select value={form.estado ?? ""} onValueChange={(v) => set("estado", v)}>
          <SelectTrigger><SelectValue placeholder="UF" /></SelectTrigger>
          <SelectContent>
            {ESTADOS.map((uf) => <SelectItem key={uf} value={uf}>{uf}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

export function CamposBancarios({ form, set }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-1.5">
        <Label>Banco</Label>
        <Input
          value={form.banco_nome ?? ""}
          onChange={(e) => set("banco_nome", e.target.value)}
          placeholder="Ex: Itaú, Nubank..."
        />
      </div>
      <div className="space-y-1.5">
        <Label>PIX</Label>
        <Input
          value={form.banco_pix ?? ""}
          onChange={(e) => set("banco_pix", e.target.value)}
          placeholder="Chave PIX"
        />
      </div>
      <div className="space-y-1.5">
        <Label>Agência</Label>
        <Input value={form.banco_agencia ?? ""} onChange={(e) => set("banco_agencia", e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label>Conta</Label>
        <Input value={form.banco_conta ?? ""} onChange={(e) => set("banco_conta", e.target.value)} />
      </div>
    </div>
  );
}

export function sanitizePayload(payload) {
  return {
    ...payload,
    cnpj:                (payload.cnpj ?? "").replace(/\D/g, ""),
    cpf:                 (payload.cpf  ?? "").replace(/\D/g, ""),
    telefone:            (payload.telefone ?? "").replace(/\D/g, ""),
    telefone_secundario: (payload.telefone_secundario ?? "").replace(/\D/g, ""),
    cep:                 (payload.cep ?? "").replace(/\D/g, ""),
  };
}

export function toastApiError(err) {
  const msgs = Object.entries(err || {})
    .map(([k, v]) => `${k}: ${Array.isArray(v) ? v[0] : v}`)
    .join(" | ");
  toast.error(msgs || "Erro ao salvar.");
}

export function formatDoc(f) {
  if (f.tipo_pessoa === "PJ" && f.cnpj) {
    const c = f.cnpj.replace(/\D/g, "");
    return c.length === 14
      ? c.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5")
      : f.cnpj;
  }
  if (f.tipo_pessoa === "PF" && f.cpf) {
    const c = f.cpf.replace(/\D/g, "");
    return c.length === 11
      ? c.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")
      : f.cpf;
  }
  return "—";
}