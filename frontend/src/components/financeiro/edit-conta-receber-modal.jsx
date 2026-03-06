import { useState, useEffect } from "react";
import { contasReceberApi, categoriasApi } from "@/lib/financeiro.api";
import { clientesApi } from "@/lib/clientes.api";
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

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function EditContaReceberModal({ conta, onClose, onSuccess, isNew = false, open: externalOpen }) {
  const isOpen = externalOpen !== undefined ? externalOpen : !!conta;

  const [clientes, setClientes] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(false);

  const [cliente, setCliente] = useState("");
  const [categoria, setCategoria] = useState("");
  const [numeroDoc, setNumeroDoc] = useState("");
  const [formaPgto, setFormaPgto] = useState("");
  const [dataCompetencia, setDataCompetencia] = useState("");
  const [descricao, setDescricao] = useState("");
  const [parcelas, setParcelas] = useState([newParcela(0)]);

  useEffect(() => {
    if (!isOpen) return;

    // clientes ainda usam public_id como identificador
    clientesApi.listar()
      .then((r) => r.json())
      .then((d) => setClientes(Array.isArray(d) ? d : (d?.results ?? [])))
      .catch(() => { });

    categoriasApi.listar()
      .then((d) => setCategorias(Array.isArray(d) ? d : (d?.results ?? [])))
      .catch(() => { });

    if (conta) {
      setCliente(conta.cliente_public_id ?? "");
      setCategoria(conta.categoria_public_id ?? "");
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
    } else {
      setCliente(""); setCategoria(""); setNumeroDoc(""); setFormaPgto("");
      setDataCompetencia(todayISO()); setDescricao("");
      setParcelas([newParcela(0)]);
    }
  }, [isOpen, conta]);

  function handleSubmit() {
    setLoading(true);
    const body = {
      tipo: "SERVICO",
      cliente: cliente || null,        // public_id (UUID)
      fornecedor: null,
      categoria: categoria || null,      // public_id (UUID)
      numero_documento: numeroDoc,
      forma_pagamento: formaPgto || undefined,
      data_competencia: dataCompetencia,
      descricao,
      total_parcelas: parcelas.length,
      parcelas: parcelas.map((p, i) => ({
        numero_parcela: i + 1,
        data_vencimento: p.data_vencimento,
        valor_bruto: parseFloat(p.valor_bruto) || 0,
        desconto: parseFloat(p.desconto) || 0,
        cod_barras: p.cod_barras,
        observacoes: p.observacoes,
      })),
    };

    const apiCall = isNew
      ? contasReceberApi.criar(body)
      : contasReceberApi.editar(conta.public_id, body);

    apiCall
      .then(() => { onSuccess?.(); onClose(); })
      .catch(() => { })
      .finally(() => setLoading(false));
  }

  const addParcela = () => setParcelas((p) => [...p, newParcela(p.length)]);
  const removeParcela = (id) => setParcelas((p) => p.filter((x) => x._id !== id));
  const updateParcela = (id, field, value) =>
    setParcelas((p) => p.map((x) => x._id === id ? { ...x, [field]: value } : x));

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{isNew ? "Nova Conta a Receber" : "Editar Conta a Receber"}</DialogTitle>
          <DialogDescription>
            {isNew ? "Preencha os campos para cadastrar uma nova conta." : "Edite os campos da conta selecionada."}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

              <div className="flex flex-col gap-2">
                <Label>Cliente <span className="text-destructive">*</span></Label>
                <Select value={cliente} onValueChange={setCliente}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    {clientes.map((c) => (
                      <SelectItem key={c.public_id} value={c.public_id}>
                        {c.nome} {c.sobrenome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-2">
                <Label>Categoria</Label>
                <Select value={categoria} onValueChange={setCategoria}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    {categorias.map((c) => (
                      <SelectItem key={c.public_id} value={c.public_id}>
                        {c.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-2">
                <Label>Nº Documento</Label>
                <Input value={numeroDoc} onChange={(e) => setNumeroDoc(e.target.value)} placeholder="NFS-2026-001" />
              </div>

              <div className="flex flex-col gap-2">
                <Label>Forma de Pagamento</Label>
                <Select value={formaPgto} onValueChange={setFormaPgto}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    {FORMAS_PGTO.map((f) => (
                      <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                    ))}
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

            {/* Parcelas */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold">Parcelas</h4>
                <Button variant="outline" size="sm" onClick={addParcela} className="gap-1.5">
                  <Plus className="size-3.5" />Adicionar
                </Button>
              </div>
              {parcelas.length === 0 && (
                <p className="text-xs text-muted-foreground">Nenhuma parcela adicionada.</p>
              )}
              {parcelas.map((p) => (
                <div key={p._id} className="rounded-lg border bg-muted/30 p-4 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">Parcela {parcelas.indexOf(p) + 1}</span>
                    {parcelas.length > 1 && (
                      <Button variant="ghost" size="icon" className="size-6 text-destructive" onClick={() => removeParcela(p._id)}>
                        <Trash2 className="size-3.5" />
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-xs">Vencimento <span className="text-destructive">*</span></Label>
                      <Input type="date" value={p.data_vencimento} onChange={(e) => updateParcela(p._id, "data_vencimento", e.target.value)} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-xs">Valor Bruto <span className="text-destructive">*</span></Label>
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
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Salvando..." : isNew ? "Cadastrar" : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}