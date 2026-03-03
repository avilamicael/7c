import { useState } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { ContasPagarTab } from "@/components/financeiro/contas-pagar-tab";
import { ContasReceberTab } from "@/components/financeiro/contas-receber-tab";
import { cn } from "@/lib/utils";
import { TrendingDown, TrendingUp } from "lucide-react";

const TABS = [
  { id: "pagar",   label: "Contas a Pagar",   icon: TrendingUp },
  { id: "receber", label: "Contas a Receber",  icon: TrendingDown },
];

export default function FinanceiroPage() {
  const [activeTab, setActiveTab] = useState("pagar");

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader title="Financeiro" />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-6 py-4 md:py-6">
              
              <div className="px-4 lg:px-6">
                <div className="grid w-full grid-cols-2 rounded-lg border bg-muted/60 p-1">
                  {TABS.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={cn(
                        "flex items-center justify-center gap-2 rounded-md py-2 text-sm font-medium transition-all",
                        activeTab === tab.id
                          ? "bg-background text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <tab.icon className="size-3.5 shrink-0" />
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="px-4 lg:px-6 pb-6">
                {activeTab === "pagar"
                  ? <ContasPagarTab />
                  : <ContasReceberTab />
                }
              </div>

            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}