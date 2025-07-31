"use client";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/Sidebar";
import { usePathname, useRouter } from "next/navigation";

export function NavMain({
  items,
}: {
  items: {
    title: string;
    path: string;
    icon?: React.ReactNode;
  }[];
}) {
  const pathName = usePathname();
  const router = useRouter();

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title} className="mb-1">
              <SidebarMenuButton
                tooltip={item.title}
                onClick={() => router.push(item.path)}
                className={`h-9 group-data-[collapsible=icon]:size-9! group-data-[collapsible=icon]:pl-2.5! pl-2.5 ${
                  (
                    item.path === "/admin"
                      ? pathName === item.path
                      : pathName.startsWith(item.path)
                  )
                    ? "bg-darkblue text-white hover:bg-darkblue/80 hover:text-white"
                    : ""
                }`}
              >
                {item.icon && item.icon}
                <span>{item.title}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}