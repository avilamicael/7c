import { useState } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { Tags, Landmark, Link2, Palette } from "lucide-react";
import { CategoriasSection } from "@/components/configuracoes/categorias-section";
import { ContasBancariasSection } from "@/components/configuracoes/contas-bancarias-section";
import { LinkCaptacaoSection } from "@/components/configuracoes/link-captacao-section";
import { PersonalizacaoSection } from "@/components/configuracoes/personalizacao-section";

const TABS = [
  { id: "categorias",     label: "Categorias",       icon: Tags,     component: CategoriasSection },
  { id: "contas",         label: "Contas Bancárias", icon: Landmark, component: ContasBancariasSection },
  { id: "captacao",       label: "Link de Captação", icon: Link2,    component: LinkCaptacaoSection },
  { id: "personalizacao", label: "Personalização",   icon: Palette,  component: PersonalizacaoSection },
];

export default function ConfiguracoesPage() {
  const [activeTab, setActiveTab] = useState("categorias");
  const ActiveComponent = TABS.find((t) => t.id === activeTab)?.component;

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader title="Configurações" />

        <div className="flex flex-1 overflow-hidden">
          {/* Nav lateral — largura fixa, altura total */}
          <aside className="hidden md:flex w-56 shrink-0 flex-col gap-1 border-r bg-muted/30 px-3 py-6">
            <p className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-widest">
              Configurações
            </p>
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all text-left w-full group",
                  activeTab === tab.id
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <tab.icon className={cn(
                  "size-4 shrink-0 transition-colors",
                  activeTab === tab.id ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"
                )} />
                {tab.label}
              </button>
            ))}
          </aside>

          {/* Nav mobile — horizontal no topo */}
          <div className="md:hidden flex gap-1 border-b bg-muted/30 px-4 py-2 overflow-x-auto">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-all shrink-0",
                  activeTab === tab.id
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <tab.icon className="size-3.5 shrink-0" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Conteúdo — ocupa todo espaço restante */}
          <main className="flex-1 overflow-y-auto p-6 md:p-8">
            {ActiveComponent && <ActiveComponent />}
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}