import { useAuth } from "@/hooks/useAuth";
import ProfileHeader from "@/components/profile-page/profile-header";
import ProfileContent from "@/components/profile-page/profile-content";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default function Page() {
  const { usuario, loading, recarregar } = useAuth();

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader title="Perfil" />
        <div className="flex flex-1 flex-col p-6">
          <div className="mx-auto w-full max-w-4xl space-y-6">
            {!loading && (
              <>
                <ProfileHeader usuario={usuario} onAtualizar={recarregar} />
                <ProfileContent usuario={usuario} onAtualizar={recarregar} />
              </>
            )}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}