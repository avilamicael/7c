import { useState } from "react";
import { cn } from "@/lib/utils";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Tags, Landmark, Link2, Palette, Truck, ChevronDown, DollarSign } from "lucide-react";
import { IconLayoutKanban } from "@tabler/icons-react";
import { CategoriasSection }      from "@/components/configuracoes/categorias-section";
import { ContasBancariasSection } from "@/components/configuracoes/contas-bancarias-section";
import { FornecedoresSection } from "@/components/configuracoes/fornecedores/fornecedores-section";
import { LinkCaptacaoSection }    from "@/components/configuracoes/link-captacao-section";
import { PersonalizacaoSection }  from "@/components/configuracoes/personalizacao-section";
import { KanbanBoardsSection }    from "@/components/configuracoes/kanban/kanban-boards-section";

const NAV = [
  {
    id: "financeiro",
    label: "Financeiro",
    icon: DollarSign,
    children: [
      { id: "categorias",  label: "Categorias",       icon: Tags,     component: CategoriasSection },
      { id: "contas",      label: "Contas Bancárias", icon: Landmark, component: ContasBancariasSection },
      { id: "fornecedores",label: "Fornecedores",     icon: Truck,    component: FornecedoresSection },
    ],
  },
  { id: "kanban-boards",  label: "Kanban — Boards",  icon: IconLayoutKanban, component: KanbanBoardsSection },
  { id: "captacao",       label: "Link de Captação", icon: Link2,    component: LinkCaptacaoSection },
  { id: "personalizacao", label: "Personalização",   icon: Palette,  component: PersonalizacaoSection },
];

function flatItems(nav) {
  return nav.flatMap((item) => item.children ?? [item]);
}

export default function ConfiguracoesPage() {
  const [activeTab, setActiveTab] = useState("categorias");
  const [openGroups, setOpenGroups] = useState({ financeiro: true });

  const toggleGroup = (id) => setOpenGroups((p) => ({ ...p, [id]: !p[id] }));

  const ActiveComponent = flatItems(NAV).find((t) => t.id === activeTab)?.component;

  const renderNav = (items) =>
    items.map((item) => {
      if (item.children) {
        const isOpen = !!openGroups[item.id];
        const hasActive = item.children.some((c) => c.id === activeTab);
        return (
          <div key={item.id}>
            <button
              onClick={() => toggleGroup(item.id)}
              className={cn(
                "flex items-center justify-between w-full rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                hasActive ? "text-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <span className="flex items-center gap-3">
                <item.icon className="size-4 shrink-0" />
                {item.label}
              </span>
              <ChevronDown className={cn("size-3.5 transition-transform", isOpen && "rotate-180")} />
            </button>
            {isOpen && (
              <div className="ml-4 flex flex-col gap-0.5 mt-0.5 border-l pl-3">
                {item.children.map((child) => (
                  <button
                    key={child.id}
                    onClick={() => setActiveTab(child.id)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all text-left w-full group",
                      activeTab === child.id
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <child.icon className={cn(
                      "size-4 shrink-0",
                      activeTab === child.id ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"
                    )} />
                    {child.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      }

      return (
        <button
          key={item.id}
          onClick={() => setActiveTab(item.id)}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all text-left w-full group",
            activeTab === item.id
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          <item.icon className={cn(
            "size-4 shrink-0",
            activeTab === item.id ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"
          )} />
          {item.label}
        </button>
      );
    });

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader title="Configurações" />
        <div className="flex flex-1 overflow-hidden">
          {/* Nav lateral */}
          <aside className="hidden md:flex w-56 shrink-0 flex-col gap-1 border-r bg-muted/30 px-3 py-6">
            <p className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-widest">
              Configurações
            </p>
            {renderNav(NAV)}
          </aside>

          {/* Nav mobile */}
          <div className="md:hidden flex gap-1 border-b bg-muted/30 px-4 py-2 overflow-x-auto">
            {flatItems(NAV).map((tab) => (
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

          <main className="flex-1 overflow-y-auto p-6 md:p-8">
            {ActiveComponent && <ActiveComponent />}
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}