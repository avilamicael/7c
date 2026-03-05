import * as React from "react"
import { Link } from "react-router-dom"
import {
  IconDashboard,
  IconHelp,
  IconSearch,
  IconUsers,
  IconLayoutKanban,
  IconCash,
  IconChecklist,
  IconPlane,
  IconSettings,
} from "@tabler/icons-react"

import { useAuth } from "@/hooks/useAuth"
import { Separator } from "@/components/ui/separator"
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

const navMain = [
  { title: "Aéreo",   url: "/", icon: IconPlane },
  { title: "Cotação", url: "/", icon: IconDashboard },
]

const navCrm = [
  { title: "Dashboard",  url: "#",           icon: IconDashboard },
  { title: "Kanban",     url: "#",           icon: IconLayoutKanban },
  { title: "Clientes",   url: "/clientes",   icon: IconUsers },
  { title: "Financeiro", url: "/financeiro", icon: IconCash },
  { title: "Tarefas",    url: "#",           icon: IconChecklist },
]

const navSecondary = [
  { title: "Configurações", url: "/configuracoes", icon: IconSettings },
  { title: "Ajuda",         url: "#",              icon: IconHelp },
  { title: "Procurar",      url: "#",              icon: IconSearch },
]

export function AppSidebar({ ...props }) {
  const { usuario, empresa } = useAuth()
  const logoSrc    = empresa?.personalizacao?.logo || DEFAULT_LOGO
  const nomeEmpresa = empresa?.nome_fantasia || "AVILA"

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="data-[slot=sidebar-menu-button]:!p-1.5">
              <Link to="/">
                <img
                  src={logoSrc}
                  alt={`Logo ${nomeEmpresa}`}
                  className="!size-5 object-contain"
                  onError={(e) => { e.currentTarget.src = DEFAULT_LOGO }}
                />
                <span className="text-base font-semibold">{nomeEmpresa}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <Separator />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} crmItems={navCrm} />
        <NavSecondary items={navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={{
          name:   usuario?.nome      || "...",
          email:  usuario?.email     || "...",
          avatar: usuario?.avatar_url || null,
        }} />
      </SidebarFooter>
    </Sidebar>
  )
}