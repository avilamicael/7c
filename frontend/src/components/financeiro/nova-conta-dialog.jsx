import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export function NovaConta({ open, onOpenChange, tipo }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {tipo === "pagar" ? "Nova Conta a Pagar" : "Nova Conta a Receber"}
          </DialogTitle>
          <DialogDescription>
            {tipo === "pagar"
              ? "Cadastre uma nova conta a pagar com parcelas."
              : "Cadastre uma nova conta a receber com parcelas."}
          </DialogDescription>
        </DialogHeader>
        {/* TODO: implementar formulário de cadastro */}
        <p className="text-sm text-muted-foreground py-4">
          Formulário de cadastro em desenvolvimento.
        </p>
      </DialogContent>
    </Dialog>
  );
}