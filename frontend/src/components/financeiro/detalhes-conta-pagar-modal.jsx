import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

const STATUS_COLOR = {
  PENDENTE:          "bg-amber-100 text-amber-700 border-amber-200",
  PAGA:              "bg-emerald-100 text-emerald-700 border-emerald-200",
  VENCIDA:           "bg-red-100 text-red-700 border-red-200",
  PARCIALMENTE_PAGA: "bg-blue-100 text-blue-700 border-blue-200",
  CANCELADA:         "bg-muted text-muted-foreground",
  BAIXA_MANUAL:      "bg-muted text-muted-foreground",
};
const STATUS_LABEL = {
  PENDENTE:"Pendente", PAGA:"Paga", VENCIDA:"Vencida",
  PARCIALMENTE_PAGA:"Parcialmente Paga", CANCELADA:"Cancelada", BAIXA_MANUAL:"Baixa Manual",
};
const FORMA_PGTO = { PIX:"PIX", BOL:"Boleto", CAR:"Cartão", TED:"TED", CHQ:"Cheque", DIN:"Dinheiro", OUT:"Outro" };

function fmt(value) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value ?? 0);
}
function fmtDate(date) {
  if (!date) return "—";
  return new Date(date + "T00:00:00").toLocaleDateString("pt-BR");
}
function InfoField({ label, value, mono = false }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <span className={cn("text-sm text-foreground", mono && "font-mono")}>{value || "—"}</span>
    </div>
  );
}
function StatusBadge({ status }) {
  return (
    <span className={cn("inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium", STATUS_COLOR[status] ?? "bg-muted text-muted-foreground")}>
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}

export function DetalhesContaPagarModal({ conta, onClose }) {
  return (
    <Dialog open={!!conta} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Detalhes da Conta a Pagar</DialogTitle>
          <DialogDescription>Visualização dos dados da conta e suas parcelas.</DialogDescription>
        </DialogHeader>
        {conta && (
          <ScrollArea className="max-h-[65vh] pr-4">
            <div className="flex flex-col gap-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <InfoField label="Fornecedor" value={conta.fornecedor_nome} />
                <InfoField label="Categoria" value={conta.categoria_nome} />
                <InfoField label="Nº Documento" value={conta.numero_documento} mono />
                <InfoField label="Descrição" value={conta.descricao} />
                <InfoField label="Forma de Pagamento" value={FORMA_PGTO[conta.forma_pagamento] ?? conta.forma_pagamento} />
                <InfoField label="Data de Competência" value={fmtDate(conta.data_competencia)} />
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-muted-foreground">Status</span>
                  <StatusBadge status={conta.status} />
                </div>
              </div>

              {conta.notas_fiscais?.length > 0 && (
                <div className="flex flex-col gap-2">
                  <h4 className="text-sm font-semibold">Notas Fiscais Vinculadas</h4>
                  <div className="flex flex-wrap gap-2">
                    {conta.notas_fiscais.map((nf, idx) => (
                      <div key={idx} className="inline-flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-1.5 text-xs">
                        <span className="font-medium">Nº {nf.numero}</span>
                        <span className="text-muted-foreground">Série {nf.serie || "—"}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-2">
                <h4 className="text-sm font-semibold">Parcelas</h4>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/40">
                        <TableHead className="w-12">Nº</TableHead>
                        <TableHead>Vencimento</TableHead>
                        <TableHead className="text-right">Valor Bruto</TableHead>
                        <TableHead className="text-right hidden sm:table-cell">Desconto</TableHead>
                        <TableHead className="text-right hidden sm:table-cell">Juros</TableHead>
                        <TableHead className="text-right hidden sm:table-cell">Multa</TableHead>
                        <TableHead className="text-right">Valor Pago</TableHead>
                        <TableHead className="text-right">Saldo</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(conta.parcelas ?? []).map((p) => (
                        <TableRow key={p.numero_parcela}>
                          <TableCell className="font-mono text-xs">{p.numero_parcela}</TableCell>
                          <TableCell>{fmtDate(p.data_vencimento)}</TableCell>
                          <TableCell className="text-right font-mono text-xs">{fmt(p.valor_bruto)}</TableCell>
                          <TableCell className="text-right font-mono text-xs hidden sm:table-cell">{fmt(p.desconto)}</TableCell>
                          <TableCell className="text-right font-mono text-xs hidden sm:table-cell">{fmt(p.juros)}</TableCell>
                          <TableCell className="text-right font-mono text-xs hidden sm:table-cell">{fmt(p.multa)}</TableCell>
                          <TableCell className="text-right font-mono text-xs font-medium">{fmt(p.valor_pago)}</TableCell>
                          <TableCell className="text-right font-mono text-xs font-medium">{fmt(p.saldo)}</TableCell>
                          <TableCell><StatusBadge status={p.status} /></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}