import { useState, useEffect, useCallback } from "react";
import { contasPagarApi, categoriasApi } from "@/lib/financeiro.api";
import { fornecedoresApi } from "@/lib/fornecedores.api";
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
import { Plus, Trash2, ClipboardList, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

const FORMAS_PGTO = [
  { value: "PIX", label: "PIX" }, { value: "BOL", label: "Boleto" },
  { value: "CAR", label: "Cartão" }, { value: "TED", label: "TED" },
  { value: "CHQ", label: "Cheque" }, { value: "DIN", label: "Dinheiro" },
  { value: "OUT", label: "Outros" },
];

const RECORRENCIAS = [
  { value: "diaria", label: "Diária" },
  { value: "semanal", label: "Semanal" },
  { value: "quinzenal", label: "Quinzenal" },
  { value: "mensal", label: "Mensal" },
  { value: "bimestral", label: "Bimestral" },
  { value: "trimestral", label: "Trimestral" },
  { value: "semestral", label: "Semestral" },
  { value: "anual", label: "Anual" },
];

const DIAS_RECORRENCIA = {
  diaria: 1, semanal: 7, quinzenal: 15, mensal: 30,
  bimestral: 60, trimestral: 90, semestral: 180, anual: 365,
};

function todayISO() {
  return new Date().toISOString().split("T")[0];
}

function addDias(isoDate, dias) {
  const d = new Date(isoDate + "T00:00:00");
  d.setDate(d.getDate() + dias);
  return d.toISOString().split("T")[0];
}

function addMeses(isoDate, meses) {
  const d = new Date(isoDate + "T00:00:00");
  d.setMonth(d.getMonth() + meses);
  return d.toISOString().split("T")[0];
}

function calcProximaData(base, tipo, index) {
  if (tipo === "mensal") return addMeses(base, index);
  if (tipo === "bimestral") return addMeses(base, index * 2);
  if (tipo === "trimestral") return addMeses(base, index * 3);
  if (tipo === "semestral") return addMeses(base, index * 6);
  if (tipo === "anual") return addMeses(base, index * 12);
  return addDias(base, DIAS_RECORRENCIA[tipo] * index);
}

function newParcela(id, dataVenc = "") {
  return { _id: id, data_vencimento: dataVenc, valor_bruto: "", cod_barras: "", observacoes: "" };
}

const MODO_TABS = [
  { id: "manual", label: "Manual", icon: ClipboardList },
  { id: "recorrencia", label: "Recorrência", icon: RefreshCw },
];

// ─── Campos base compartilhados ────────────────────────────────────────────────
function CamposBase({ fornecedores, categorias, state, set }) {
  return (
    <div className="flex flex-col gap-4">
      {/* Linha 1: Fornecedor (largo) + Categoria */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-5">
        <div className="flex flex-col gap-2 sm:col-span-3">
          <Label>Fornecedor <span className="text-destructive">*</span></Label>
          <Select value={state.fornecedor} onValueChange={(v) => set("fornecedor", v)}>
            <SelectTrigger className="w-full"><SelectValue placeholder="Selecione o fornecedor..." /></SelectTrigger>
            <SelectContent>
              {fornecedores.map((f) => (
                <SelectItem key={f.public_id} value={f.public_id}>
                  {f.nome_fantasia || f.razao_social}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-2 sm:col-span-2">
          <Label>Categoria</Label>
          <Select value={state.categoria} onValueChange={(v) => set("categoria", v)}>
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
      </div>

      {/* Linha 2: Forma Pgto + Data Competência + Nº Documento */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-2">
          <Label>Forma de Pagamento</Label>
          <Select value={state.formaPgto} onValueChange={(v) => set("formaPgto", v)}>
            <SelectTrigger className="w-full"><SelectValue placeholder="Selecione..." /></SelectTrigger>
            <SelectContent>
              {FORMAS_PGTO.map((f) => (
                <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-2">
          <Label>Data de Competência <span className="text-destructive">*</span></Label>
          <Input type="date" value={state.dataCompetencia} onChange={(e) => set("dataCompetencia", e.target.value)} />
        </div>

        <div className="flex flex-col gap-2">
          <Label>Nº Documento</Label>
          <Input value={state.numeroDoc} onChange={(e) => set("numeroDoc", e.target.value)} placeholder="NF-2026-001" />
        </div>
      </div>

      {/* Linha 3: Descrição */}
      <div className="flex flex-col gap-2">
        <Label>Descrição</Label>
        <Textarea
          value={state.descricao}
          onChange={(e) => set("descricao", e.target.value)}
          placeholder="Descrição da conta..."
          className="resize-none"
          rows={2}
        />
      </div>
    </div>
  );
}

// ─── Seção de Notas Fiscais ────────────────────────────────────────────────────
function NotasFiscaisSection({ notasFiscais, addNF, removeNF, updateNF }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold">Notas Fiscais</h4>
        <Button variant="outline" size="sm" onClick={addNF} className="gap-1.5">
          <Plus className="size-3.5" />Adicionar
        </Button>
      </div>
      {notasFiscais.length === 0 && (
        <p className="text-xs text-muted-foreground">Nenhuma nota fiscal adicionada.</p>
      )}
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
  );
}

// ─── Modo Manual: parcelas livres ──────────────────────────────────────────────
function ModoManual({ parcelas, addParcela, removeParcela, updateParcela }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold">Parcelas</h4>
        <Button variant="outline" size="sm" onClick={addParcela} className="gap-1.5">
          <Plus className="size-3.5" />Adicionar
        </Button>
      </div>
      {parcelas.map((p, index) => (
        <div key={p._id} className="flex flex-col gap-3 rounded-lg border bg-muted/30 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Parcela {index + 1}</span>
            {parcelas.length > 1 && (
              <Button
                variant="ghost" size="icon"
                onClick={() => removeParcela(p._id)}
                className="text-destructive hover:text-destructive size-7"
              >
                <Trash2 className="size-3.5" />
              </Button>
            )}
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">Data de Vencimento</Label>
              <Input
                type="date"
                value={p.data_vencimento}
                onChange={(e) => updateParcela(p._id, "data_vencimento", e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">Valor Bruto</Label>
              <Input
                type="number" step="0.01" min="0"
                value={p.valor_bruto}
                onChange={(e) => updateParcela(p._id, "valor_bruto", e.target.value)}
                placeholder="0,00"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">Código de Barras</Label>
              <Input
                value={p.cod_barras}
                onChange={(e) => updateParcela(p._id, "cod_barras", e.target.value)}
                placeholder="Opcional"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">Observações</Label>
              <Input
                value={p.observacoes}
                onChange={(e) => updateParcela(p._id, "observacoes", e.target.value)}
                placeholder="Opcional"
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Modo Recorrência ──────────────────────────────────────────────────────────
function ModoRecorrencia({ rec, setRec }) {
  const { tipo, quantidade, valorBruto, primeiroVenc } = rec;

  function handleChange(field, value) {
    setRec((prev) => ({ ...prev, [field]: value }));
  }

  const preview = (() => {
    if (!primeiroVenc || !tipo || !quantidade || !valorBruto) return [];
    const n = Math.min(parseInt(quantidade) || 0, 120);
    return Array.from({ length: n }, (_, i) => ({
      num: i + 1,
      data: calcProximaData(primeiroVenc, tipo, i),
    }));
  })();

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col gap-2">
          <Label>Tipo de Recorrência <span className="text-destructive">*</span></Label>
          <Select value={tipo} onValueChange={(v) => handleChange("tipo", v)}>
            <SelectTrigger className="w-full"><SelectValue placeholder="Selecione..." /></SelectTrigger>
            <SelectContent>
              {RECORRENCIAS.map((r) => (
                <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-2">
          <Label>Qtd. de Parcelas <span className="text-destructive">*</span></Label>
          <Input
            type="number" min="1" max="120"
            value={quantidade}
            onChange={(e) => handleChange("quantidade", e.target.value)}
            placeholder="Ex: 12"
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label>Valor por Parcela <span className="text-destructive">*</span></Label>
          <Input
            type="number" step="0.01" min="0"
            value={valorBruto}
            onChange={(e) => handleChange("valorBruto", e.target.value)}
            placeholder="0,00"
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label>Primeiro Vencimento <span className="text-destructive">*</span></Label>
          <Input
            type="date"
            value={primeiroVenc}
            onChange={(e) => handleChange("primeiroVenc", e.target.value)}
          />
        </div>
      </div>

      {preview.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Pré-visualização — {preview.length} parcela(s)
            </h4>
            <span className="text-xs text-muted-foreground font-mono">
              Total: {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
                parseFloat(valorBruto || 0) * preview.length
              )}
            </span>
          </div>
          <ScrollArea className="max-h-48 rounded-md border bg-muted/20">
            <div className="divide-y">
              {preview.map((item) => (
                <div key={item.num} className="flex items-center justify-between px-4 py-2 text-sm">
                  <span className="text-muted-foreground text-xs">Parcela {item.num}</span>
                  <span className="font-mono text-xs">
                    {new Date(item.data + "T00:00:00").toLocaleDateString("pt-BR")}
                  </span>
                  <span className="font-mono text-xs font-medium">
                    {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
                      parseFloat(valorBruto || 0)
                    )}
                  </span>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
}

// ─── Modal Principal ───────────────────────────────────────────────────────────
export function EditContaPagarModal({ conta, onClose, onSuccess, isNew = false, open: externalOpen }) {
  const isOpen = externalOpen !== undefined ? externalOpen : !!conta;

  const [fornecedores, setFornecedores] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modo, setModo] = useState("manual");

  const [base, setBase] = useState({
    fornecedor: "", categoria: "", numeroDoc: "", formaPgto: "",
    dataCompetencia: "", descricao: "",
  });

  const setBaseField = useCallback((field, value) => setBase((p) => ({ ...p, [field]: value })), []);

  const [parcelas, setParcelas] = useState([newParcela(0)]);
  const [notasFiscais, setNotasFiscais] = useState([]);
  const [rec, setRec] = useState({
    tipo: "", quantidade: "", valorBruto: "", primeiroVenc: "",
  });

  useEffect(() => {
    if (!isOpen) return;

    fornecedoresApi.listar().then(setFornecedores).catch(() => { });
    categoriasApi.listar().then(setCategorias).catch(() => { });

    if (conta) {
      setBase({
        fornecedor: conta.fornecedor_public_id ?? "",
        categoria: conta.categoria_public_id ?? "",
        numeroDoc: conta.numero_documento ?? "",
        formaPgto: conta.forma_pagamento ?? "",
        dataCompetencia: conta.data_competencia ?? "",
        descricao: conta.descricao ?? "",
      });
      setParcelas(
        (conta.parcelas ?? []).map((p, i) => ({
          _id: i,
          data_vencimento: p.data_vencimento ?? "",
          valor_bruto: p.valor_bruto ?? "",
          cod_barras: p.cod_barras ?? "",
          observacoes: p.observacoes ?? "",
        }))
      );
      setNotasFiscais(
        (conta.notas_fiscais ?? []).map((nf, i) => ({ _id: i, numero: nf.numero, serie: nf.serie ?? "" }))
      );
    } else {
      setBase({
        fornecedor: "", categoria: "", numeroDoc: "", formaPgto: "",
        dataCompetencia: todayISO(),
        descricao: "",
      });
      setParcelas([newParcela(0)]);
      setNotasFiscais([]);
      setRec({ tipo: "", quantidade: "", valorBruto: "", primeiroVenc: "" });
      setModo("manual");
    }
  }, [isOpen, conta]);

  function buildParcelasFromRec() {
    const n = parseInt(rec.quantidade) || 0;
    return Array.from({ length: n }, (_, i) => ({
      numero_parcela: i + 1,
      data_vencimento: calcProximaData(rec.primeiroVenc, rec.tipo, i),
      valor_bruto: parseFloat(rec.valorBruto) || 0,
      desconto: 0,
      cod_barras: "",
      observacoes: "",
    }));
  }

  function handleSubmit() {
    const parcelasPayload = modo === "recorrencia"
      ? buildParcelasFromRec()
      : parcelas.map((p, i) => ({
        numero_parcela: i + 1,
        data_vencimento: p.data_vencimento,
        valor_bruto: parseFloat(p.valor_bruto) || 0,
        desconto: 0,
        cod_barras: p.cod_barras,
        observacoes: p.observacoes,
      }));

    setLoading(true);
    const body = {
      fornecedor: base.fornecedor || null,
      categoria: base.categoria || null,
      numero_documento: base.numeroDoc,
      forma_pagamento: base.formaPgto,
      data_competencia: base.dataCompetencia,
      descricao: base.descricao,
      total_parcelas: parcelasPayload.length,
      notas_fiscais: notasFiscais.map(({ numero, serie }) => ({ numero, serie })),
      parcelas: parcelasPayload,
    };

    const apiCall = isNew ? contasPagarApi.criar(body) : contasPagarApi.editar(conta.public_id, body);
    apiCall
      .then(() => { onSuccess?.(); onClose(); })
      .catch(() => { })
      .finally(() => setLoading(false));
  }

  const addParcela = () => setParcelas((p) => [...p, newParcela(p.length)]);
  const removeParcela = (id) => setParcelas((p) => p.filter((x) => x._id !== id));
  const updateParcela = (id, field, value) =>
    setParcelas((p) => p.map((x) => x._id === id ? { ...x, [field]: value } : x));

  const addNF = () => setNotasFiscais((p) => [...p, { _id: p.length, numero: "", serie: "" }]);
  const removeNF = (id) => setNotasFiscais((p) => p.filter((x) => x._id !== id));
  const updateNF = (id, field, value) =>
    setNotasFiscais((p) => p.map((x) => x._id === id ? { ...x, [field]: value } : x));

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="!max-w-5xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{isNew ? "Nova Conta a Pagar" : "Editar Conta a Pagar"}</DialogTitle>
          <DialogDescription>
            {isNew
              ? "Preencha os campos para cadastrar uma nova conta."
              : "Edite os campos da conta selecionada."}
          </DialogDescription>
        </DialogHeader>

        {/* Mode switcher — apenas para nova conta */}
        {isNew && (
          <div className="grid w-full grid-cols-2 rounded-lg border bg-muted/60 p-1">
            {MODO_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setModo(tab.id)}
                className={cn(
                  "flex items-center justify-center gap-2 rounded-md py-2 text-sm font-medium transition-all",
                  modo === tab.id
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <tab.icon className="size-3.5 shrink-0" />
                {tab.label}
              </button>
            ))}
          </div>
        )}

        <ScrollArea className="max-h-[62vh] pr-4">
          <div className="flex flex-col gap-6 pb-1">
            <CamposBase
              fornecedores={fornecedores}
              categorias={categorias}
              state={base}
              set={setBaseField}
            />

            <NotasFiscaisSection
              notasFiscais={notasFiscais}
              addNF={addNF}
              removeNF={removeNF}
              updateNF={updateNF}
            />

            {(!isNew || modo === "manual") && (
              <ModoManual
                parcelas={parcelas}
                addParcela={addParcela}
                removeParcela={removeParcela}
                updateParcela={updateParcela}
              />
            )}

            {isNew && modo === "recorrencia" && (
              <ModoRecorrencia rec={rec} setRec={setRec} />
            )}
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