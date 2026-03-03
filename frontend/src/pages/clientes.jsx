import { useAuth } from "@/hooks/useAuth";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { ClientesTable } from "@/components/clientes/clientes-table";

export default function ClientesPage() {
  const { usuario } = useAuth();
  const isAdmin = usuario?.role === "admin";

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <div className="px-4 lg:px-6 space-y-2">
                <h1 className="text-2xl font-bold">Clientes</h1>
                <p className="text-muted-foreground text-sm">
                  Gerencie sua base de clientes.
                </p>
              </div>
              <div className="px-4 lg:px-6">
                <ClientesTable isAdmin={isAdmin} />
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}