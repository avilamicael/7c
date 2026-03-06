import { useAuth } from "@/hooks/useAuth";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { TarefasTab } from "@/components/tarefas/tarefas-tab";

export default function TarefasPage() {
  const { usuario } = useAuth();
  const isAdmin = usuario?.role === "admin";

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader title="Tarefas" />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-6 py-4 md:py-6">
              <div className="px-4 lg:px-6">
                <TarefasTab isAdmin={isAdmin} usuario={usuario} />
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
