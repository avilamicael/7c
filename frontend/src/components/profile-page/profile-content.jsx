import { useState, useEffect, useRef } from "react";
import { Shield, Key } from "lucide-react";
import {
  IconCopy,
  IconCheck,
  IconPalette,
  IconLink,
  IconDeviceFloppy,
  IconPhoto,
  IconUpload,
  IconX,
} from "@tabler/icons-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

import { usuariosApi } from "@/lib/usuarios.api";
import { empresasApi } from "@/lib/empresas.api";

const TAMANHO_MAXIMO_MB = 2;
const FORMATOS_ACEITOS = ["image/jpeg", "image/png"];
const MOCK_LINK_CAPTACAO = "https://app.seudominio.com.br/leads/empresa-demo";

const PLANOS = [
  { id: "basico", label: "Básico", descricao: "Até 3 usuários · 500 clientes" },
  { id: "profissional", label: "Profissional", descricao: "Até 10 usuários · clientes ilimitados" },
  { id: "enterprise", label: "Enterprise", descricao: "Usuários ilimitados · suporte prioritário" },
];

// ─── Personalização (apenas admin) ───────────────────────────────────────────

function PersonalizacaoSection() {
  const [linkCopiado, setLinkCopiado] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const inputLogoRef = useRef(null);

  const [personalizacao, setPersonalizacao] = useState({
    cor_primaria: "#1E3A5F",
    cor_secundaria: "#FFFFFF",
    logo: null,
    logoPreview: null,
    logoArquivo: null,
  });

  useEffect(() => {
    empresasApi.buscarPersonalizacao()
      .then((data) => {
        setPersonalizacao((prev) => ({
          ...prev,
          cor_primaria: data.cor_primaria || "#1E3A5F",
          cor_secundaria: data.cor_secundaria || "#FFFFFF",
          logo: data.logo || null,
        }));
      })
      .catch(() => toast.error("Erro ao carregar personalizações."))
      .finally(() => setCarregando(false));
  }, []);

  function handleSelecionarLogo(e) {
    const arquivo = e.target.files?.[0];
    if (!arquivo) return;
    if (!FORMATOS_ACEITOS.includes(arquivo.type)) {
      toast.error("Formato inválido. Use JPG ou PNG.");
      return;
    }
    if (arquivo.size > TAMANHO_MAXIMO_MB * 1024 * 1024) {
      toast.error(`A imagem deve ter no máximo ${TAMANHO_MAXIMO_MB}MB.`);
      return;
    }
    const previewUrl = URL.createObjectURL(arquivo);
    setPersonalizacao((prev) => ({ ...prev, logoPreview: previewUrl, logoArquivo: arquivo }));
  }

  function handleRemoverLogo() {
    if (personalizacao.logoPreview) URL.revokeObjectURL(personalizacao.logoPreview);
    setPersonalizacao((prev) => ({ ...prev, logoPreview: null, logoArquivo: null }));
    if (inputLogoRef.current) inputLogoRef.current.value = "";
  }

  async function handleSalvar() {
    setSalvando(true);
    try {
      const formData = new FormData();
      formData.append("cor_primaria", personalizacao.cor_primaria);
      formData.append("cor_secundaria", personalizacao.cor_secundaria);
      if (personalizacao.logoArquivo) {
        formData.append("logo", personalizacao.logoArquivo);
      }
      await empresasApi.editarPersonalizacao(formData);
      toast.success("Personalizações salvas com sucesso.");
    } catch {
      toast.error("Erro ao salvar. Tente novamente.");
    } finally {
      setSalvando(false);
    }
  }

  function handleCopiarLink() {
    navigator.clipboard.writeText(MOCK_LINK_CAPTACAO);
    setLinkCopiado(true);
    toast.success("Link copiado para a área de transferência.");
    setTimeout(() => setLinkCopiado(false), 2500);
  }

  const logoExibida = personalizacao.logoPreview || personalizacao.logo;

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <IconLink className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-base">Link de captação</CardTitle>
            <Badge variant="secondary" className="ml-auto text-xs">Em breve</Badge>
          </div>
          <CardDescription>Compartilhe este link com seus clientes para captação de leads.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              readOnly
              value={MOCK_LINK_CAPTACAO}
              className="font-mono text-sm text-muted-foreground bg-muted cursor-default select-all"
            />
            <Button variant="outline" size="icon" onClick={handleCopiarLink}>
              {linkCopiado
                ? <IconCheck className="h-4 w-4 text-green-500" />
                : <IconCopy className="h-4 w-4" />}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <IconPalette className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-base">Personalização visual</CardTitle>
          </div>
          <CardDescription>Defina as cores e o logotipo exibidos para seus clientes.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          {carregando ? (
            <div className="flex flex-col gap-4">
              <div className="h-24 w-full rounded-md bg-muted animate-pulse" />
              <div className="h-10 w-full rounded-md bg-muted animate-pulse" />
              <div className="h-10 w-full rounded-md bg-muted animate-pulse" />
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-1.5">
                <Label>Logotipo</Label>
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-md border bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                    {logoExibida
                      ? <img src={logoExibida} alt="Logo da empresa" className="h-full w-full object-contain" />
                      : <IconPhoto className="h-6 w-6 text-muted-foreground" />}
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="gap-2" onClick={() => inputLogoRef.current?.click()}>
                        <IconUpload className="h-4 w-4" />
                        {logoExibida ? "Trocar logo" : "Enviar logo"}
                      </Button>
                      {personalizacao.logoPreview && (
                        <Button variant="ghost" size="sm" className="gap-2 text-destructive hover:text-destructive" onClick={handleRemoverLogo}>
                          <IconX className="h-4 w-4" />
                          Remover
                        </Button>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">JPG ou PNG, máximo 2MB.</p>
                  </div>
                </div>
                <input ref={inputLogoRef} type="file" accept="image/jpeg,image/png" className="hidden" onChange={handleSelecionarLogo} />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="cor-primaria">Cor primária</Label>
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-md border shadow-sm flex-shrink-0" style={{ backgroundColor: personalizacao.cor_primaria }} />
                  <Input
                    id="cor-primaria"
                    type="color"
                    value={personalizacao.cor_primaria}
                    onChange={(e) => setPersonalizacao((prev) => ({ ...prev, cor_primaria: e.target.value }))}
                    className="h-9 w-16 cursor-pointer p-1 rounded-md border"
                  />
                  <Input
                    type="text"
                    value={personalizacao.cor_primaria.toUpperCase()}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (/^#[0-9A-Fa-f]{0,6}$/.test(val))
                        setPersonalizacao((prev) => ({ ...prev, cor_primaria: val }));
                    }}
                    maxLength={7}
                    className="font-mono text-sm w-28"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="cor-secundaria">Cor secundária</Label>
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-md border shadow-sm flex-shrink-0" style={{ backgroundColor: personalizacao.cor_secundaria }} />
                  <Input
                    id="cor-secundaria"
                    type="color"
                    value={personalizacao.cor_secundaria}
                    onChange={(e) => setPersonalizacao((prev) => ({ ...prev, cor_secundaria: e.target.value }))}
                    className="h-9 w-16 cursor-pointer p-1 rounded-md border"
                  />
                  <Input
                    type="text"
                    value={personalizacao.cor_secundaria.toUpperCase()}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (/^#[0-9A-Fa-f]{0,6}$/.test(val))
                        setPersonalizacao((prev) => ({ ...prev, cor_secundaria: val }));
                    }}
                    maxLength={7}
                    className="font-mono text-sm w-28"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <Button onClick={handleSalvar} disabled={salvando} className="gap-2">
                  <IconDeviceFloppy className="h-4 w-4" />
                  {salvando ? "Salvando..." : "Salvar alterações"}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </>
  );
}

// ─── Aba Pessoal ──────────────────────────────────────────────────────────────

function PersonalTab({ usuario, onAtualizar }) {
  const [form, setForm] = useState({ nome: "", sobrenome: "", email: "", telefone: "" });
  const [salvando, setSalvando] = useState(false);
  const isAdmin = usuario?.role === "admin";

  useEffect(() => {
    if (usuario) {
      setForm({
        nome: usuario.nome || "",
        sobrenome: usuario.sobrenome || "",
        email: usuario.email || "",
        telefone: usuario.telefone || "",
      });
    }
  }, [usuario]);

  async function handleSalvar() {
    setSalvando(true);
    try {
      await usuariosApi.atualizarPerfil(form);
      toast.success("Perfil atualizado.");
      onAtualizar?.();
    } catch (err) {
      const msg = Object.values(err || {}).flat()[0] || "Erro ao atualizar.";
      toast.error(msg);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Informações Pessoais</CardTitle>
          <CardDescription>Atualize seus dados pessoais e informações de perfil.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome</Label>
              <Input
                id="nome"
                value={form.nome}
                onChange={(e) => setForm((p) => ({ ...p, nome: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sobrenome">Sobrenome</Label>
              <Input
                id="sobrenome"
                value={form.sobrenome}
                onChange={(e) => setForm((p) => ({ ...p, sobrenome: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone</Label>
              <Input
                id="telefone"
                value={form.telefone}
                onChange={(e) => setForm((p) => ({ ...p, telefone: e.target.value }))}
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={handleSalvar} disabled={salvando} className="gap-2">
              <IconDeviceFloppy className="h-4 w-4" />
              {salvando ? "Salvando..." : "Atualizar Perfil"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {isAdmin && <PersonalizacaoSection />}
    </div>
  );
}

// ─── Aba Conta ────────────────────────────────────────────────────────────────

function AccountTab({ usuario }) {
  const isAdmin = usuario?.role === "admin";

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Configurações da Conta</CardTitle>
          <CardDescription>Gerencie suas preferências de conta e assinatura.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-base">Status da Conta</Label>
              <p className="text-muted-foreground text-sm">Sua conta está atualmente ativa</p>
            </div>
            <Badge variant="outline" className="border-green-200 bg-green-50 text-green-700">
              Ativa
            </Badge>
          </div>

          <Separator />

          <div className="space-y-1">
            <Label className="text-base">Plano de Assinatura</Label>
            {isAdmin ? (
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                {PLANOS.map((plano) => (
                  <div
                    key={plano.id}
                    className="rounded-lg border p-4 space-y-1 cursor-default"
                  >
                    <p className="font-medium text-sm">{plano.label}</p>
                    <p className="text-xs text-muted-foreground">{plano.descricao}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground mt-1">
                Apenas administradores podem gerenciar o plano de assinatura.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Aba Segurança ────────────────────────────────────────────────────────────

function SecurityTab() {
  const [form, setForm] = useState({ senha_atual: "", nova_senha: "", confirmar_nova_senha: "" });
  const [salvando, setSalvando] = useState(false);

  async function handleAlterarSenha() {
    setSalvando(true);
    try {
      await usuarioApi.alterarSenha(form);
      toast.success("Senha alterada com sucesso.");
      setForm({ senha_atual: "", nova_senha: "", confirmar_nova_senha: "" });
    } catch (err) {
      const msg = Object.values(err || {}).flat()[0] || "Erro ao alterar senha.";
      toast.error(msg);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Alterar Senha</CardTitle>
          <CardDescription>Use uma senha forte com no mínimo 8 caracteres.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="senha_atual">Senha atual</Label>
            <Input
              id="senha_atual"
              type="password"
              value={form.senha_atual}
              onChange={(e) => setForm((p) => ({ ...p, senha_atual: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="nova_senha">Nova senha</Label>
            <Input
              id="nova_senha"
              type="password"
              value={form.nova_senha}
              onChange={(e) => setForm((p) => ({ ...p, nova_senha: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmar_nova_senha">Confirmar nova senha</Label>
            <Input
              id="confirmar_nova_senha"
              type="password"
              value={form.confirmar_nova_senha}
              onChange={(e) => setForm((p) => ({ ...p, confirmar_nova_senha: e.target.value }))}
            />
          </div>
          <div className="flex justify-end">
            <Button onClick={handleAlterarSenha} disabled={salvando} className="gap-2">
              <Key className="mr-2 h-4 w-4" />
              {salvando ? "Salvando..." : "Alterar Senha"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Autenticação em Dois Fatores
          </CardTitle>
          <CardDescription>
            Adicione uma camada extra de segurança à sua conta.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between opacity-50">
            <div className="space-y-1">
              <Label className="text-base">Ativar 2FA</Label>
              <p className="text-muted-foreground text-sm">Disponível em uma próxima atualização.</p>
            </div>
            <Button variant="outline" size="sm" disabled className="gap-2">
              🔒 Em breve
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Aba Notificações ─────────────────────────────────────────────────────────

const NOTIFICACOES = [
  { key: "email", label: "Notificações por E-mail", desc: "Receba notificações por e-mail" },
  { key: "push", label: "Notificações Push", desc: "Receba notificações push no seu navegador" },
  { key: "marketing", label: "E-mails de Marketing", desc: "Receba e-mails sobre novidades e atualizações" },
  { key: "resumo_semanal", label: "Resumo Semanal", desc: "Receba um resumo semanal das suas atividades" },
  { key: "alerta_seguranca", label: "Alertas de Segurança", desc: "Notificações importantes de segurança (sempre ativas no futuro)" },
];

function NotificationsTab() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Preferências de Notificação</CardTitle>
          <CardDescription>Em breve você poderá escolher quais notificações deseja receber.</CardDescription>
        </div>
        <Badge variant="outline" className="gap-1 border-amber-300 bg-amber-50 text-amber-700">
          🚧 Em breve
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4 opacity-70">
        {NOTIFICACOES.map((n, i) => (
          <div key={n.key}>
            {i > 0 && <Separator className="mb-4" />}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-base">{n.label}</Label>
                <p className="text-muted-foreground text-sm">{n.desc}</p>
              </div>
              <Switch checked={false} disabled />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// ─── Export ───────────────────────────────────────────────────────────────────

export default function ProfileContent({ usuario, onAtualizar }) {
  return (
    <Tabs defaultValue="personal" className="space-y-6">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="personal">Pessoal</TabsTrigger>
        <TabsTrigger value="account">Conta</TabsTrigger>
        <TabsTrigger value="security">Segurança</TabsTrigger>
        <TabsTrigger value="notifications">Notificações</TabsTrigger>
      </TabsList>

      <TabsContent value="personal">
        <PersonalTab usuario={usuario} onAtualizar={onAtualizar} />
      </TabsContent>
      <TabsContent value="account">
        <AccountTab usuario={usuario} />
      </TabsContent>
      <TabsContent value="security">
        <SecurityTab />
      </TabsContent>
      <TabsContent value="notifications">
        <NotificationsTab />
      </TabsContent>
    </Tabs>
  );
}