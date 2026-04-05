"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  CalendarDays,
  CreditCard,
  LayoutDashboard,
  Megaphone,
  Settings,
  UserRound,
  Users,
  Zap,
} from "lucide-react";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "Overview", icon: LayoutDashboard, adminOnly: false },
  { href: "/jobs/today", label: "Today's Jobs", icon: Zap, adminOnly: false },
  { href: "/leads", label: "Leads", icon: Megaphone, adminOnly: true },
  { href: "/customers", label: "Customers", icon: UserRound, adminOnly: true },
  {
    href: "/bookings",
    label: "Bookings",
    icon: CalendarDays,
    adminOnly: false,
  },
  { href: "/payments", label: "Payments", icon: CreditCard, adminOnly: true },
  {
    href: "/complaints",
    label: "Complaints",
    icon: AlertTriangle,
    adminOnly: true,
  },
  { href: "/workers", label: "Workers", icon: Users, adminOnly: true },
  {
    href: "/settings/lookups",
    label: "Settings",
    icon: Settings,
    adminOnly: true,
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { user } = useUser();
  const isAdmin = user?.publicMetadata?.role === "admin";
  const visibleItems = NAV_ITEMS.filter((item) => !item.adminOnly || isAdmin);

  return (
    <Sidebar>
      <SidebarHeader className="h-14 justify-center border-b border-sidebar-border px-4">
        <span className="text-sm font-semibold text-sidebar-foreground">
          Koelnr
        </span>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleItems.map(({ href, label, icon: Icon }) => {
                const isActive =
                  href === "/" ? pathname === "/" : pathname.startsWith(href);
                return (
                  <SidebarMenuItem key={href}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link href={href}>
                        <Icon className={cn("h-4 w-4 shrink-0")} />
                        {label}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
