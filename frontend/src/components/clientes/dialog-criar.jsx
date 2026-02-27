import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { StepIndicator } from "./step-indicator";
import { Step1, Step2, Step3 } from "./clientes-form-steps";

const STEPS = ["Dados Pessoais", "Documentos", "Contato"];

const emptyCliente = {
  nome: "",
  sobrenome: "",
  data_nascimento: "",
  nacionalidade: "",
  passaporte: "",
  passaporte_emissao: "",
  passaporte_expiracao: "",
  passaporte_pais: "",
  email: "",
  rede_social: "",
  observacoes: "",
  ativo: true,
  documentos: [{ id: Date.now(), tipo: "cpf", numero: "" }],
  telefones: [{ id: Date.now() + 1, tipo: "proprio", nome: "", numero: "" }],
};

export function DialogCriar({ open, onClose, onCreate }) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(emptyCliente);

  const handleChange = (field, value) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleClose = () => {
    setStep(0);
    setForm(emptyCliente);
    onClose();
  };

  const handleSave = () => {
    onCreate({
      ...form,
      id: String(Date.now()),
      public_id: crypto.randomUUID(),
      data_cadastro: new Date().toISOString(),
    });
    handleClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="!max-w-2xl">
        <DialogHeader>
          <DialogTitle>Novo Cliente</DialogTitle>
        </DialogHeader>

        <StepIndicator current={step} steps={STEPS} />

        <div className="min-h-[260px]">
          {step === 0 && <Step1 form={form} onChange={handleChange} />}
          {step === 1 && <Step2 form={form} onChange={handleChange} />}
          {step === 2 && <Step3 form={form} onChange={handleChange} />}
        </div>

        <DialogFooter className="flex justify-between mt-4">
          <Button
            variant="outline"
            onClick={() => (step === 0 ? handleClose() : setStep(step - 1))}
          >
            {step === 0 ? "Cancelar" : "Voltar"}
          </Button>
          <Button
            onClick={() => (step < STEPS.length - 1 ? setStep(step + 1) : handleSave())}
          >
            {step < STEPS.length - 1 ? "Próximo" : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
