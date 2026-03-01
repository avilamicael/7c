import { useState } from "react";
import { Mail, Lock, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import logo from "@/assets/logo.png";
import ForgotPasswordDialog from "@/components/forgot-password-dialog";
import { useNavigate } from "react-router-dom";
import { authApi } from "@/lib/auth.api";

const features = [
  "Gestão completa de clientes",
  "Cotações e reservas aéreas",
  "Controle financeiro integrado",
  "Calendário e compromissos",
];

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error("Preencha todos os campos");
      return;
    }

    setIsLoading(true);

    try {
      const res = await authApi.login(email, password);

      if (res.status === 429) {
        toast.error("Muitas tentativas. Aguarde um momento e tente novamente.");
        return;
      }

      if (!res.ok) {
        toast.error("E-mail ou senha incorretos.");
        return;
      }

      const { access, refresh } = await res.json();

      localStorage.setItem("access", access);
      localStorage.setItem("refresh", refresh);

      toast.success("Login realizado com sucesso!");
      navigate("/");
    } catch (error) {
      toast.error("Erro de conexão. Verifique sua internet.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Lado esquerdo — gradiente escuro com features */}
      <div
        className="hidden lg:flex lg:w-1/2 relative overflow-hidden flex-col items-center justify-center px-12 text-card-foreground"
        style={{
          background:
            "linear-gradient(135deg, hsl(160 30% 12%) 0%, hsl(165 50% 18%) 40%, hsl(170 60% 25%) 70%, hsl(160 70% 30%) 100%)",
        }}
      >
        <div
          className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-20"
          style={{
            background:
              "radial-gradient(circle, hsl(161 93% 30% / 0.6), transparent 70%)",
          }}
        />
        <div className="relative z-10 max-w-md text-center">
          <img
            src={logo}
            alt="7C Turismo"
            className="h-28 w-auto mx-auto mb-8"
          />
          <h2
            className="text-3xl font-bold mb-4"
            style={{ color: "hsl(0 0% 95%)" }}
          >
            Sistema de Gestão
          </h2>
          <p
            className="text-base mb-10 opacity-80"
            style={{ color: "hsl(0 0% 85%)" }}
          >
            Plataforma completa para agências de viagens gerenciarem clientes,
            cotações e operações
          </p>
          <ul className="space-y-4 text-left">
            {features.map((feature) => (
              <li key={feature} className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
                <span style={{ color: "hsl(0 0% 90%)" }}>{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Lado direito — formulário */}
      <div className="flex w-full lg:w-1/2 items-center justify-center bg-background px-6 py-12">
        <div className="w-full max-w-md">
          <div className="flex justify-center mb-6">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary shadow-lg">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="h-7 w-7"
                stroke="hsl(151 80% 95%)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
          </div>

          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold text-foreground">
              Bem-vindo de volta!
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Acesse sua conta para continuar
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-12"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 h-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-base font-semibold"
              size="lg"
              disabled={isLoading}
              style={{
                background:
                  "linear-gradient(90deg, hsl(80 60% 55%), hsl(161 93% 40%))",
              }}
            >
              {isLoading ? "Entrando..." : "Entrar no Sistema"}
            </Button>
          </form>

          <div className="mt-5 text-center">
            <button
              type="button"
              onClick={() => setForgotOpen(true)}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Esqueceu sua senha?
            </button>
          </div>

          <p className="mt-12 text-center text-xs text-muted-foreground">
            © 2024 7C Sistemas. Todos os direitos reservados.
          </p>
        </div>
      </div>

      <ForgotPasswordDialog open={forgotOpen} onOpenChange={setForgotOpen} />
    </div>
  );
}