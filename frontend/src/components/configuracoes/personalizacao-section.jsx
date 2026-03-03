import { useState, useEffect, useRef } from "react";

import {
  IconPalette, IconUpload, IconX, IconPhoto, IconDeviceFloppy,
} from "@tabler/icons-react";
import { toast } from "sonner";
import { empresasApi } from "@/lib/empresas.api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const TAMANHO_MAX_MB = 2;
const FORMATOS = ["image/jpeg", "image/png"];

export function PersonalizacaoSection() {
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando]     = useState(false);
  const inputLogoRef = useRef(null);

  const [form, setForm] = useState({
    cor_primaria:   "#1E3A5F",
    cor_secundaria: "#FFFFFF",
    logo:           null,
    logoPreview:    null,
    logoArquivo:    null,
  });

  useEffect(() => {
    empresasApi.buscarPersonalizacao()
      .then((data) => setForm((p) => ({
        ...p,
        cor_primaria:   data.cor_primaria   || "#1E3A5F",
        cor_secundaria: data.cor_secundaria || "#FFFFFF",
        logo:           data.logo           || null,
      })))
      .catch(() => toast.error("Erro ao carregar personalizações."))
      .finally(() => setCarregando(false));
  }, []);

  function handleSelecionarLogo(e) {
    const arquivo = e.target.files?.[0];
    if (!arquivo) return;
    if (!FORMATOS.includes(arquivo.type)) { toast.error("Use JPG ou PNG."); return; }
    if (arquivo.size > TAMANHO_MAX_MB * 1024 * 1024) { toast.error(`Máximo ${TAMANHO_MAX_MB}MB.`); return; }
    setForm((p) => ({ ...p, logoPreview: URL.createObjectURL(arquivo), logoArquivo: arquivo }));
  }

  function handleRemoverLogo() {
    if (form.logoPreview) URL.revokeObjectURL(form.logoPreview);
    setForm((p) => ({ ...p, logoPreview: null, logoArquivo: null }));
    if (inputLogoRef.current) inputLogoRef.current.value = "";
  }

  function setCor(field, value) {
    setForm((p) => ({ ...p, [field]: value }));
  }

  async function handleSalvar() {
    setSalvando(true);
    try {
      const fd = new FormData();
      fd.append("cor_primaria",   form.cor_primaria);
      fd.append("cor_secundaria", form.cor_secundaria);
      if (form.logoArquivo) fd.append("logo", form.logoArquivo);
      await empresasApi.editarPersonalizacao(fd);
      toast.success("Personalizações salvas.");
    } catch {
      toast.error("Erro ao salvar. Tente novamente.");
    } finally {
      setSalvando(false);
    }
  }

  const logoExibida = form.logoPreview || form.logo;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <IconPalette className="size-5 text-muted-foreground" />
          <div>
            <CardTitle className="text-base">Personalização Visual</CardTitle>
            <CardDescription>Logotipo e cores exibidos para seus clientes.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {carregando ? (
          <div className="flex flex-col gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-12 rounded-md bg-muted animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {/* Logo */}
            <div className="flex flex-col gap-2">
              <Label>Logotipo</Label>
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-md border bg-muted flex items-center justify-center overflow-hidden shrink-0">
                  {logoExibida
                    ? <img src={logoExibida} alt="Logo" className="h-full w-full object-contain" />
                    : <IconPhoto className="size-6 text-muted-foreground" />}
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="gap-2" onClick={() => inputLogoRef.current?.click()}>
                      <IconUpload className="size-4" />
                      {logoExibida ? "Trocar" : "Enviar logo"}
                    </Button>
                    {form.logoPreview && (
                      <Button variant="ghost" size="sm" className="gap-2 text-destructive hover:text-destructive" onClick={handleRemoverLogo}>
                        <IconX className="size-4" />Remover
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">JPG ou PNG, máx. 2MB.</p>
                </div>
              </div>
              <input ref={inputLogoRef} type="file" accept="image/jpeg,image/png" className="hidden" onChange={handleSelecionarLogo} />
            </div>

            {/* Cor primária */}
            <ColorField
              id="cor-primaria"
              label="Cor primária"
              value={form.cor_primaria}
              onChange={(v) => setCor("cor_primaria", v)}
            />

            {/* Cor secundária */}
            <ColorField
              id="cor-secundaria"
              label="Cor secundária"
              value={form.cor_secundaria}
              onChange={(v) => setCor("cor_secundaria", v)}
            />

            <div className="flex justify-end">
              <Button onClick={handleSalvar} disabled={salvando} className="gap-2">
                <IconDeviceFloppy className="size-4" />
                {salvando ? "Salvando..." : "Salvar alterações"}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ColorField({ id, label, value, onChange }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-md border shadow-sm shrink-0" style={{ backgroundColor: value }} />
        <Input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-16 cursor-pointer p-1 rounded-md border"
        />
        <Input
          id={id}
          type="text"
          value={value.toUpperCase()}
          onChange={(e) => {
            const v = e.target.value;
            if (/^#[0-9A-Fa-f]{0,6}$/.test(v)) onChange(v);
          }}
          maxLength={7}
          className="font-mono text-sm w-28"
        />
      </div>
    </div>
  );
}