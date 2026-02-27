import { useState, useEffect, useRef } from "react"
import { toast } from "sonner"
import {
  IconCopy,
  IconCheck,
  IconPalette,
  IconLink,
  IconDeviceFloppy,
  IconPhoto,
  IconUpload,
  IconX,
} from "@tabler/icons-react"

import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

// ─── Mock: substituir por chamada real à API ──────────────────────────────────
const MOCK_PERSONALIZACAO = {
  cor_primaria: "#1E3A5F",
  cor_secundaria: "#FFFFFF",
  logo: null, // null = sem logo cadastrada, usa o padrão
  data_atualizacao: "2026-02-20T10:30:00Z",
}

const MOCK_LINK_CAPTACAO = "https://app.seudominio.com.br/leads/empresa-demo"
// ─────────────────────────────────────────────────────────────────────────────

const TAMANHO_MAXIMO_MB = 2
const FORMATOS_ACEITOS = ["image/jpeg", "image/png"]

export default function ConfiguracoesPage() {
  const [linkCopiado, setLinkCopiado] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [carregando, setCarregando] = useState(true)
  const inputLogoRef = useRef(null)

  const [personalizacao, setPersonalizacao] = useState({
    cor_primaria: "#1E3A5F",
    cor_secundaria: "#FFFFFF",
    logo: null,        // URL vinda do backend
    logoPreview: null, // preview local antes de salvar
    logoArquivo: null, // File object para enviar ao backend
  })

  // ── GET /api/empresas/minha/personalizacao/ ────────────────────────────────
  useEffect(() => {
    async function carregarPersonalizacao() {
      try {
        // TODO: substituir pelo fetch real
        // const res = await fetch("/api/empresas/minha/personalizacao/", {
        //   headers: { Authorization: `Bearer ${accessToken}` },
        // })
        // const data = await res.json()

        await new Promise((r) => setTimeout(r, 600))
        const data = MOCK_PERSONALIZACAO

        setPersonalizacao((prev) => ({
          ...prev,
          cor_primaria: data.cor_primaria,
          cor_secundaria: data.cor_secundaria,
          logo: data.logo,
        }))
      } catch {
        toast.error("Erro ao carregar personalizações.")
      } finally {
        setCarregando(false)
      }
    }

    carregarPersonalizacao()
  }, [])

  // ── Seleção de arquivo de logo ─────────────────────────────────────────────
  function handleSelecionarLogo(e) {
    const arquivo = e.target.files?.[0]
    if (!arquivo) return

    if (!FORMATOS_ACEITOS.includes(arquivo.type)) {
      toast.error("Formato inválido. Use JPG ou PNG.")
      return
    }

    if (arquivo.size > TAMANHO_MAXIMO_MB * 1024 * 1024) {
      toast.error(`A imagem deve ter no máximo ${TAMANHO_MAXIMO_MB}MB.`)
      return
    }

    const previewUrl = URL.createObjectURL(arquivo)
    setPersonalizacao((prev) => ({
      ...prev,
      logoPreview: previewUrl,
      logoArquivo: arquivo,
    }))
  }

  function handleRemoverLogo() {
    if (personalizacao.logoPreview) {
      URL.revokeObjectURL(personalizacao.logoPreview)
    }
    setPersonalizacao((prev) => ({
      ...prev,
      logoPreview: null,
      logoArquivo: null,
    }))
    if (inputLogoRef.current) inputLogoRef.current.value = ""
  }

  // ── PUT /api/empresas/minha/personalizacao/ ────────────────────────────────
  async function handleSalvar() {
    setSalvando(true)
    try {
      // TODO: substituir pelo fetch real
      // O backend espera multipart/form-data quando há logo, ou JSON sem logo
      //
      // const formData = new FormData()
      // formData.append("cor_primaria", personalizacao.cor_primaria)
      // formData.append("cor_secundaria", personalizacao.cor_secundaria)
      // if (personalizacao.logoArquivo) {
      //   formData.append("logo", personalizacao.logoArquivo)
      // }
      // const res = await fetch("/api/empresas/minha/personalizacao/", {
      //   method: "PUT",
      //   headers: { Authorization: `Bearer ${accessToken}` },
      //   body: formData,
      // })
      // if (!res.ok) throw new Error()

      await new Promise((r) => setTimeout(r, 800))
      toast.success("Personalizações salvas com sucesso.")
    } catch {
      toast.error("Erro ao salvar. Tente novamente.")
    } finally {
      setSalvando(false)
    }
  }

  function handleCopiarLink() {
    navigator.clipboard.writeText(MOCK_LINK_CAPTACAO)
    setLinkCopiado(true)
    toast.success("Link copiado para a área de transferência.")
    setTimeout(() => setLinkCopiado(false), 2500)
  }

  // Imagem exibida no preview: arquivo novo > logo do backend > nenhuma
  const logoExibida = personalizacao.logoPreview || personalizacao.logo

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <SiteHeader title="Configurações" />

        <main className="flex flex-1 flex-col gap-6 p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* ── Card: Link de captação ────────────────────────────────── */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <IconLink className="h-5 w-5 text-muted-foreground" />
                  <CardTitle className="text-base">Link de captação</CardTitle>
                  <Badge variant="secondary" className="ml-auto text-xs">
                    Em breve
                  </Badge>
                </div>
                <CardDescription>
                  Compartilhe este link com seus clientes para captação de leads.
                  O endereço é gerado automaticamente e não pode ser alterado.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Input
                    readOnly
                    value={MOCK_LINK_CAPTACAO}
                    className="font-mono text-sm text-muted-foreground bg-muted cursor-default select-all"
                    aria-label="Link de captação (somente leitura)"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleCopiarLink}
                    title="Copiar link"
                    aria-label="Copiar link"
                  >
                    {linkCopiado ? (
                      <IconCheck className="h-4 w-4 text-green-500" />
                    ) : (
                      <IconCopy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* ── Card: Personalização visual ──────────────────────────── */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <IconPalette className="h-5 w-5 text-muted-foreground" />
                  <CardTitle className="text-base">Personalização visual</CardTitle>
                </div>
                <CardDescription>
                  Defina as cores e o logotipo exibidos para seus clientes.
                </CardDescription>
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
                    {/* ── Logo ─────────────────────────────────────────── */}
                    <div className="flex flex-col gap-1.5">
                      <Label>Logotipo</Label>
                      <div className="flex items-center gap-4">
                        {/* Preview */}
                        <div className="h-16 w-16 rounded-md border bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                          {logoExibida ? (
                            <img
                              src={logoExibida}
                              alt="Logo da empresa"
                              className="h-full w-full object-contain"
                            />
                          ) : (
                            <IconPhoto className="h-6 w-6 text-muted-foreground" />
                          )}
                        </div>

                        <div className="flex flex-col gap-2">
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-2"
                              onClick={() => inputLogoRef.current?.click()}
                            >
                              <IconUpload className="h-4 w-4" />
                              {logoExibida ? "Trocar logo" : "Enviar logo"}
                            </Button>
                            {personalizacao.logoPreview && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="gap-2 text-destructive hover:text-destructive"
                                onClick={handleRemoverLogo}
                              >
                                <IconX className="h-4 w-4" />
                                Remover
                              </Button>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            JPG ou PNG, máximo 2MB.
                          </p>
                        </div>
                      </div>

                      <input
                        ref={inputLogoRef}
                        type="file"
                        accept="image/jpeg,image/png"
                        className="hidden"
                        onChange={handleSelecionarLogo}
                        aria-label="Selecionar arquivo de logo"
                      />
                    </div>

                    {/* ── Cor primária ──────────────────────────────────── */}
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="cor-primaria">Cor primária</Label>
                      <div className="flex items-center gap-3">
                        <div
                          className="h-9 w-9 rounded-md border shadow-sm flex-shrink-0 transition-colors"
                          style={{ backgroundColor: personalizacao.cor_primaria }}
                          aria-hidden="true"
                        />
                        <Input
                          id="cor-primaria"
                          type="color"
                          value={personalizacao.cor_primaria}
                          onChange={(e) =>
                            setPersonalizacao((prev) => ({ ...prev, cor_primaria: e.target.value }))
                          }
                          className="h-9 w-16 cursor-pointer p-1 rounded-md border"
                          aria-label="Selecionar cor primária"
                        />
                        <Input
                          type="text"
                          value={personalizacao.cor_primaria.toUpperCase()}
                          onChange={(e) => {
                            const val = e.target.value
                            if (/^#[0-9A-Fa-f]{0,6}$/.test(val))
                              setPersonalizacao((prev) => ({ ...prev, cor_primaria: val }))
                          }}
                          maxLength={7}
                          className="font-mono text-sm w-28"
                          aria-label="Código hex da cor primária"
                        />
                      </div>
                    </div>

                    {/* ── Cor secundária ────────────────────────────────── */}
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="cor-secundaria">Cor secundária</Label>
                      <div className="flex items-center gap-3">
                        <div
                          className="h-9 w-9 rounded-md border shadow-sm flex-shrink-0 transition-colors"
                          style={{ backgroundColor: personalizacao.cor_secundaria }}
                          aria-hidden="true"
                        />
                        <Input
                          id="cor-secundaria"
                          type="color"
                          value={personalizacao.cor_secundaria}
                          onChange={(e) =>
                            setPersonalizacao((prev) => ({ ...prev, cor_secundaria: e.target.value }))
                          }
                          className="h-9 w-16 cursor-pointer p-1 rounded-md border"
                          aria-label="Selecionar cor secundária"
                        />
                        <Input
                          type="text"
                          value={personalizacao.cor_secundaria.toUpperCase()}
                          onChange={(e) => {
                            const val = e.target.value
                            if (/^#[0-9A-Fa-f]{0,6}$/.test(val))
                              setPersonalizacao((prev) => ({ ...prev, cor_secundaria: val }))
                          }}
                          maxLength={7}
                          className="font-mono text-sm w-28"
                          aria-label="Código hex da cor secundária"
                        />
                      </div>
                    </div>

                    {/* ── Botão salvar ──────────────────────────────────── */}
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
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}