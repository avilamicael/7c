import { Link, useLocation } from "react-router-dom"

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroupLabel
} from "@/components/ui/sidebar"

export function NavMain({ items, crmItems }) {
  const location = useLocation()

  const renderItems = (list) =>
    list.map((item) => (
      <SidebarMenuItem key={item.title}>
        <SidebarMenuButton
          asChild
          tooltip={item.title}
          isActive={location.pathname === item.url}
        >
          <Link to={item.url === "#" ? "/" : item.url}>
            {item.icon && <item.icon />}
            <span>{item.title}</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    ))

  return (
    <>
      <SidebarGroup>
        <SidebarGroupLabel>AVILA</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>{renderItems(items)}</SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      {crmItems?.length > 0 && (
        <SidebarGroup>
          <SidebarGroupLabel>CRM</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>{renderItems(crmItems)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      )}
    </>
  )
}