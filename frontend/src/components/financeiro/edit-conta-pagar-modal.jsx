import { useState, useEffect } from "react";
import { request, authHeaders } from "@/lib/api";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";

const FORMAS_PGTO = [
  { value: "PIX", label: "PIX" }, { value: "BOL", label: "Boleto" },
  { value: "CAR", label: "Cartão" }, { value: "TED", label: "TED" },
  { value: "CHQ", label: "Cheque" }, { value: "DIN", label: "Dinheiro" },
  { value: "OUT", label: "Outros" },
];

function newParcela(id) {
  return { _id: id, data_vencimento: "", valor_bruto: "", desconto: "", cod_barras: "", observacoes: "" };
}

export function EditContaPagarModal({ conta, onClose, onSuccess, isNew = false, open: externalOpen }) {
  const isOpen = externalOpen !== undefined ? externalOpen : !!conta;

  const [fornecedores, setFornecedores] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(false);

  const [fornecedor, setFornecedor] = useState("");
  const [categoria, setCategoria] = useState("");
  const [numeroDoc, setNumeroDoc] = useState("");
  const [formaPgto, setFormaPgto] = useState("");
  const [dataCompetencia, setDataCompetencia] = useState("");
  const [descricao, setDescricao] = useState("");
  const [parcelas, setParcelas] = useState([newParcela(0)]);
  const [notasFiscais, setNotasFiscais] = useState([]);

  useEffect(() => {
    if (!isOpen) return;
    request("/fornecedores/", { headers: authHeaders() }).then((r) => r.json()).then((d) => setFornecedores(Array.isArray(d) ? d : (d?.results ?? [])));
    request("/financeiro/categorias/", { headers: authHeaders() }).then((r) => r.json()).then((d) => setCategorias(Array.isArray(d) ? d : (d?.results ?? [])));

    if (conta) {
      setFornecedor(String(conta.fornecedor ?? ""));
      setCategoria(String(conta.categoria ?? ""));
      setNumeroDoc(conta.numero_documento ?? "");
      setFormaPgto(conta.forma_pagamento ?? "");
      setDataCompetencia(conta.data_competencia ?? "");
      setDescricao(conta.descricao ?? "");
      setParcelas(
        (conta.parcelas ?? []).map((p, i) => ({
          _id: i,
          data_vencimento: p.data_vencimento ?? "",
          valor_bruto: p.valor_bruto ?? "",
          desconto: p.desconto ?? "",
          cod_barras: p.cod_barras ?? "",
          observacoes: p.observacoes ?? "",
        }))
      );
      setNotasFiscais(
        (conta.notas_fiscais ?? []).map((nf, i) => ({ _id: i, numero: nf.numero, serie: nf.serie ?? "" }))
      );
    } else {
      setFornecedor(""); setCategoria(""); setNumeroDoc(""); setFormaPgto("");
      setDataCompetencia(""); setDescricao("");
      setParcelas([newParcela(0)]); setNotasFiscais([]);
    }
  }, [isOpen, conta]);

  function handleSubmit() {
    setLoading(true);
    const body = {
      fornecedor: parseInt(fornecedor),
      categoria: categoria ? parseInt(categoria) : null,
      numero_documento: numeroDoc,
      forma_pagamento: formaPgto,
      data_competencia: dataCompetencia,
      descricao,
      total_parcelas: parcelas.length,
      notas_fiscais: notasFiscais.map(({ numero, serie }) => ({ numero, serie })),
      parcelas: parcelas.map((p, i) => ({
        numero_parcela: i + 1,
        data_vencimento: p.data_vencimento,
        valor_bruto: parseFloat(p.valor_bruto) || 0,
        desconto: parseFloat(p.desconto) || 0,
        cod_barras: p.cod_barras,
        observacoes: p.observacoes,
      })),
    };

    const url = isNew ? "/financeiro/contas-pagar/" : `/financeiro/contas-pagar/${conta.public_id}/`;
    const method = isNew ? "POST" : "PATCH";

    request(url, { method, headers: { ...authHeaders(), "Content-Type": "application/json" }, body: JSON.stringify(body) })
      .then((res) => {
        if (res.ok) { onSuccess?.(); onClose(); }
      })
      .finally(() => setLoading(false));
  }

  const addParcela = () => setParcelas((p) => [...p, newParcela(p.length)]);
  const removeParcela = (id) => setParcelas((p) => p.filter((x) => x._id !== id));
  const updateParcela = (id, field, value) => setParcelas((p) => p.map((x) => x._id === id ? { ...x, [field]: value } : x));

  const addNF = () => setNotasFiscais((p) => [...p, { _id: p.length, numero: "", serie: "" }]);
  const removeNF = (id) => setNotasFiscais((p) => p.filter((x) => x._id !== id));
  const updateNF = (id, field, value) => setNotasFiscais((p) => p.map((x) => x._id === id ? { ...x, [field]: value } : x));

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{isNew ? "Nova Conta a Pagar" : "Editar Conta a Pagar"}</DialogTitle>
          <DialogDescription>
            {isNew ? "Preencha os campos para cadastrar uma nova conta." : "Edite os campos da conta selecionada."}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label>Fornecedor</Label>
                <Select value={fornecedor} onValueChange={setFornecedor}>
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    {fornecedores.map((f) => <SelectItem key={f.id} value={String(f.id)}>{f.nome_fantasia || f.razao_social}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label>Categoria</Label>
                <Select value={categoria} onValueChange={setCategoria}>
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    {categorias.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label>Nº Documento</Label>
                <Input value={numeroDoc} onChange={(e) => setNumeroDoc(e.target.value)} placeholder="NF-2026-001" />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Forma de Pagamento</Label>
                <Select value={formaPgto} onValueChange={setFormaPgto}>
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    {FORMAS_PGTO.map((f) => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label>Data de Competência</Label>
                <Input type="date" value={dataCompetencia} onChange={(e) => setDataCompetencia(e.target.value)} />
              </div>
              <div className="flex flex-col gap-2 sm:col-span-2">
                <Label>Descrição</Label>
                <Textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Descrição da conta..." />
              </div>
            </div>

            {/* Notas Fiscais */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold">Notas Fiscais</h4>
                <Button variant="outline" size="sm" onClick={addNF} className="gap-1.5"><Plus className="size-3.5" />Adicionar</Button>
              </div>
              {notasFiscais.length === 0 && <p className="text-xs text-muted-foreground">Nenhuma nota fiscal adicionada.</p>}
              {notasFiscais.map((nf) => (
                <div key={nf._id} className="flex items-end gap-3">
                  <div className="flex flex-1 flex-col gap-1.5">
                    <Label className="text-xs">Número</Label>
                    <Input value={nf.numero} onChange={(e) => updateNF(nf._id, "numero", e.target.value)} placeholder="1234" />
                  </div>
                  <div className="flex flex-1 flex-col gap-1.5">
                    <Label className="text-xs">Série</Label>
                    <Input value={nf.serie} onChange={(e) => updateNF(nf._id, "serie", e.target.value)} placeholder="1" />
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => removeNF(nf._id)} className="text-destructive hover:text-destructive mb-0.5">
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))}
            </div>

            {/* Parcelas */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold">Parcelas</h4>
                <Button variant="outline" size="sm" onClick={addParcela} className="gap-1.5"><Plus className="size-3.5" />Adicionar</Button>
              </div>
              {parcelas.map((p, index) => (
                <div key={p._id} className="flex flex-col gap-3 rounded-lg border bg-muted/30 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-muted-foreground">Parcela {index + 1}</span>
                    {parcelas.length > 1 && (
                      <Button variant="ghost" size="icon" onClick={() => removeParcela(p._id)} className="text-destructive hover:text-destructive size-7">
                        <Trash2 className="size-3.5" />
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-xs">Data de Vencimento</Label>
                      <Input type="date" value={p.data_vencimento} onChange={(e) => updateParcela(p._id, "data_vencimento", e.target.value)} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-xs">Valor Bruto</Label>
                      <Input type="number" step="0.01" value={p.valor_bruto} onChange={(e) => updateParcela(p._id, "valor_bruto", e.target.value)} placeholder="0,00" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-xs">Desconto</Label>
                      <Input type="number" step="0.01" value={p.desconto} onChange={(e) => updateParcela(p._id, "desconto", e.target.value)} placeholder="0,00" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-xs">Código de Barras</Label>
                      <Input value={p.cod_barras} onChange={(e) => updateParcela(p._id, "cod_barras", e.target.value)} placeholder="Código de barras..." />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-xs">Observações</Label>
                      <Input value={p.observacoes} onChange={(e) => updateParcela(p._id, "observacoes", e.target.value)} placeholder="Observações..." />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={loading}>{loading ? "Salvando..." : isNew ? "Cadastrar" : "Salvar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}