import { AppSidebar } from "@/components/AppSidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/Sidebar";
import { FirebaseNextJSProvider } from "../hooks/useFirebase";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex h-screen flex-col">
      <FirebaseNextJSProvider>
        <SidebarProvider defaultOpen={false}>
          <AppSidebar />
          <div className="flex flex-1 flex-col">
            <SidebarInset>
              <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
                <div className="flex items-center gap-2 px-4">
                  <SidebarTrigger className="-ml-1" />
                </div>
              </header>
              <main className="flex-1">{children}</main>
            </SidebarInset>
          </div>
        </SidebarProvider>
      </FirebaseNextJSProvider>
    </div>
  );
}
