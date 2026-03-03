import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function Step1({ form, onChange }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-1.5">
        <Label>Nome <span className="text-destructive">*</span></Label>
        <Input value={form.nome} onChange={(e) => onChange("nome", e.target.value)} placeholder="Nome" />
      </div>
      <div className="space-y-1.5">
        <Label>Sobrenome <span className="text-destructive">*</span></Label>
        <Input value={form.sobrenome} onChange={(e) => onChange("sobrenome", e.target.value)} placeholder="Sobrenome" />
      </div>
      <div className="space-y-1.5">
        <Label>Data de Nascimento</Label>
        <DatePicker value={form.data_nascimento} onChange={(val) => onChange("data_nascimento", val)} placeholder="Data de nascimento" />
      </div>
      <div className="space-y-1.5">
        <Label>Nacionalidade (ISO)</Label>
        <Input
          value={form.nacionalidade}
          onChange={(e) => onChange("nacionalidade", e.target.value.toUpperCase().slice(0, 2))}
          placeholder="BR"
          maxLength={2}
        />
      </div>
      <div className="space-y-1.5 col-span-2">
        <Label>Observações</Label>
        <Textarea value={form.observacoes} onChange={(e) => onChange("observacoes", e.target.value)} placeholder="Observações" />
      </div>
    </div>
  );
}

export function Step2({ form, onChange }) {
  const addDocumento = () =>
    onChange("documentos", [...form.documentos, { id: Date.now(), tipo: "outro", numero: "" }]);

  const removeDocumento = (id) =>
    onChange("documentos", form.documentos.filter((d) => d.id !== id));

  const updateDocumento = (id, field, value) =>
    onChange("documentos", form.documentos.map((d) => (d.id === id ? { ...d, [field]: value } : d)));

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-semibold mb-3 text-foreground">Passaporte</p>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Número</Label>
            <Input value={form.passaporte} onChange={(e) => onChange("passaporte", e.target.value)} placeholder="AB123456" />
          </div>
          <div className="space-y-1.5">
            <Label>País Emissor (ISO)</Label>
            <Input
              value={form.passaporte_pais}
              onChange={(e) => onChange("passaporte_pais", e.target.value.toUpperCase().slice(0, 2))}
              placeholder="BR"
              maxLength={2}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Data de Emissão</Label>
            <DatePicker value={form.passaporte_emissao} onChange={(val) => onChange("passaporte_emissao", val)} placeholder="Data de emissão" />
          </div>
          <div className="space-y-1.5">
            <Label>Data de Expiração</Label>
            <DatePicker value={form.passaporte_expiracao} onChange={(val) => onChange("passaporte_expiracao", val)} placeholder="Data de expiração" />
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-foreground">Outros Documentos</p>
          <Button type="button" variant="outline" size="sm" onClick={addDocumento}>+ Adicionar</Button>
        </div>
        <div className="space-y-3">
          {form.documentos.map((doc) => (
            <div key={doc.id} className="flex gap-3 items-end">
              <div className="space-y-1.5 w-36">
                <Label>Tipo</Label>
                <Select value={doc.tipo} onValueChange={(v) => updateDocumento(doc.id, "tipo", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cpf">CPF</SelectItem>
                    <SelectItem value="rg">RG</SelectItem>
                    <SelectItem value="cnh">CNH</SelectItem>
                    <SelectItem value="outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 flex-1">
                <Label>Número</Label>
                <Input value={doc.numero} onChange={(e) => updateDocumento(doc.id, "numero", e.target.value)} placeholder="Número do documento" />
              </div>
              {form.documentos.length > 1 && (
                <Button type="button" variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => removeDocumento(doc.id)}>
                  Remover
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function Step3({ form, onChange }) {
  const addTelefone = () =>
    onChange("telefones", [...form.telefones, { id: Date.now(), tipo: "outro", nome: "", numero: "" }]);

  const removeTelefone = (id) =>
    onChange("telefones", form.telefones.filter((t) => t.id !== id));

  const updateTelefone = (id, field, value) =>
    onChange("telefones", form.telefones.map((t) => (t.id === id ? { ...t, [field]: value } : t)));

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Email</Label>
          <Input type="email" value={form.email} onChange={(e) => onChange("email", e.target.value)} placeholder="email@exemplo.com" />
        </div>
        <div className="space-y-1.5">
          <Label>Rede Social</Label>
          <Input value={form.rede_social} onChange={(e) => onChange("rede_social", e.target.value)} placeholder="@usuario" />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-foreground">Telefones</p>
          <Button type="button" variant="outline" size="sm" onClick={addTelefone}>+ Adicionar</Button>
        </div>
        <div className="space-y-3">
          {form.telefones.map((tel) => (
            <div key={tel.id} className="flex gap-3 items-end">
              <div className="space-y-1.5 w-36">
                <Label>Tipo</Label>
                <Select value={tel.tipo} onValueChange={(v) => updateTelefone(tel.id, "tipo", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="proprio">Próprio</SelectItem>
                    <SelectItem value="outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {tel.tipo === "outro" && (
                <div className="space-y-1.5 flex-1">
                  <Label>Nome do Contato</Label>
                  <Input value={tel.nome} onChange={(e) => updateTelefone(tel.id, "nome", e.target.value)} placeholder="Nome" />
                </div>
              )}
              <div className="space-y-1.5 flex-1">
                <Label>Número</Label>
                <Input value={tel.numero} onChange={(e) => updateTelefone(tel.id, "numero", e.target.value)} placeholder="(00) 00000-0000" />
              </div>
              {form.telefones.length > 1 && (
                <Button type="button" variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => removeTelefone(tel.id)}>
                  Remover
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}