"use client";

import * as React from "react";
import { NavMain } from "@/components/NavMain";
import { NavUser } from "@/components/NavUser";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarRail,
} from "@/components/ui/Sidebar";
import { ClockIcon, LayoutDashboardIcon, LogsIcon, Shield } from "lucide-react";

const data = {
  navMain: [
    {
      title: "Dashboard",
      path: "/admin/dashboard",
      icon: <LayoutDashboardIcon />,
    },
    {
      title: "Requests",
      path: "/admin/requests",
      icon: <ClockIcon width={20} height={20} />,
    },
    {
      title: "Authorized visitors",
      path: "/admin/authorized",
      icon: <Shield width={20} height={20} />,
    },
    {
      title: "Logs",
      path: "/admin/logs",
      icon: <LogsIcon width={20} height={20} />,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props} className="border-gray-800">
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
