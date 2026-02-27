import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Step1, Step2, Step3 } from "./clientes-form-steps";

export function DialogEditar({ open, onClose, cliente, onSave, onDelete, isAdmin }) {
  const [form, setForm] = useState(cliente);

  useEffect(() => {
    setForm(cliente);
  }, [cliente]);

  const handleChange = (field, value) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSave = () => {
    onSave(form);
    onClose();
  };

  if (!cliente) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="!max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {cliente.nome} {cliente.sobrenome}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-2">
          <div>
            <p className="text-sm font-semibold mb-3 border-b pb-1">Dados Pessoais</p>
            <Step1 form={form} onChange={handleChange} />
          </div>
          <div>
            <p className="text-sm font-semibold mb-3 border-b pb-1">Documentos</p>
            <Step2 form={form} onChange={handleChange} />
          </div>
          <div>
            <p className="text-sm font-semibold mb-3 border-b pb-1">Contato</p>
            <Step3 form={form} onChange={handleChange} />
          </div>
        </div>

        <DialogFooter className="flex justify-between mt-2">
          {isAdmin && (
            <Button
              variant="destructive"
              onClick={() => { onDelete(cliente.id); onClose(); }}
            >
              Excluir Cliente
            </Button>
          )}
          <div className="flex gap-2 ml-auto">
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
            <Button onClick={handleSave}>Salvar Alterações</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
