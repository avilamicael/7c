import { useState } from "react";
import { Mail } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ForgotPasswordDialog({ open, onOpenChange }) {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      toast.error("Informe seu e-mail");
      return;
    }
    setIsLoading(true);
    // TODO: substituir pela chamada real à API
    // await fetch("/api/auth/password-reset/", { method: "POST", body: JSON.stringify({ email }) })
    setTimeout(() => {
      setIsLoading(false);
      setSent(true);
      toast.success("E-mail de recuperação enviado!");
    }, 1500);
  };

  const handleClose = (value) => {
    if (!value) {
      setSent(false);
      setEmail("");
    }
    onOpenChange(value);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="sm:max-w-md"
        style={{ backgroundColor: "hsl(0 0% 96%)", border: "1px solid hsl(0 0% 83%)" }}
      >
        <DialogHeader>
          <DialogTitle style={{ color: "hsl(0 0% 9%)" }}>Recuperar senha</DialogTitle>
          <DialogDescription style={{ color: "hsl(0 0% 40%)" }}>
            {sent
              ? "Verifique sua caixa de entrada para redefinir a senha."
              : "Informe seu e-mail e enviaremos um link para redefinir sua senha."}
          </DialogDescription>
        </DialogHeader>

        {!sent ? (
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="forgot-email" style={{ color: "hsl(0 0% 9%)" }}>
                E-mail
              </Label>
              <div className="relative">
                <Mail
                  className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
                  style={{ color: "hsl(161 93% 30%)" }}
                />
                <Input
                  id="forgot-email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-11 focus-visible:ring-0"
                  style={{
                    backgroundColor: "hsl(0 0% 100%)",
                    border: "1.5px solid hsl(161 93% 30%)",
                    borderRadius: "0.5rem",
                    color: "hsl(0 0% 9%)",
                  }}
                />
              </div>
            </div>
            <Button
              type="submit"
              className="w-full h-11 font-semibold hover:opacity-90 transition-opacity"
              disabled={isLoading}
              style={{
                backgroundColor: "hsl(161 93% 30%)",
                color: "hsl(151 80% 95%)",
                borderRadius: "0.5rem",
              }}
            >
              {isLoading ? "Enviando..." : "Enviar link de recuperação"}
            </Button>
          </form>
        ) : (
          <div className="pt-2">
            <Button
              className="w-full h-11 font-semibold hover:opacity-90 transition-opacity"
              onClick={() => handleClose(false)}
              style={{
                backgroundColor: "hsl(161 93% 30%)",
                color: "hsl(151 80% 95%)",
                borderRadius: "0.5rem",
              }}
            >
              Voltar ao login
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}