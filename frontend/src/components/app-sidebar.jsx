import * as React from "react"
import { Link } from "react-router-dom"
import {
  IconDashboard,
  IconHelp,
  IconSearch,
  IconSettings,
  IconUsers,
  IconLayoutKanban,
  IconCash,
  IconChecklist,
  IconPlane,

} from "@tabler/icons-react"

import { Separator } from "@/components/ui/separator"
import { NavDocuments } from "@/components/nav-documents"
import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const DEFAULT_LOGO = "/logoAuth.png"

const data = {
  user: {
    name: "Micael",
    email: "micael@gmail.com",
    avatar: "/avatars/shadcn.jpg",
  },
  // Logo da empresa vinda do backend — null usa o padrão
  // TODO: substituir por contexto/store quando conectar a API
  // GET /api/empresas/minha/personalizacao/ → { logo: "https://..." }
  empresa: {
    nome: "7C Turismo & Consultoria",
    logo: null,
  },
  navMain: [
    { title: "Aéreo", url: "/", icon: IconPlane },
    { title: "Cotação", url: "/", icon: IconDashboard },
  ],
  navSecondary: [
    { title: "Configurações", url: "/configuracoes", icon: IconSettings },
    { title: "Ajuda", url: "#", icon: IconHelp },
    { title: "Procurar", url: "#", icon: IconSearch },
  ],
  documents: [
    { name: "Dashboard", url: "#", icon: IconDashboard },
    { name: "Kanban", url: "#", icon: IconLayoutKanban },
    { name: "Clientes", url: "#", icon: IconUsers },
    { name: "Financeiro", url: "#", icon: IconCash },
    { name: "Tarefas", url: "#", icon: IconChecklist },
  ],
}

export function AppSidebar({ ...props }) {
  const logoSrc = data.empresa.logo || DEFAULT_LOGO

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="data-[slot=sidebar-menu-button]:!p-1.5">
              <Link to="/">
                <img
                  src={logoSrc}
                  alt={`Logo ${data.empresa.nome}`}
                  className="!size-5 object-contain"
                  onError={(e) => { e.currentTarget.src = DEFAULT_LOGO }}
                />
                <span className="text-base font-semibold">{data.empresa.nome}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <Separator />
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavDocuments items={data.documents} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}