import { AppSidebar } from "@/src/components/common/app-sidebar";
import { SiteHeader } from "@/src/components/site-header";
import { SidebarInset, SidebarProvider } from "@/src/components/ui/sidebar";
import { TooltipProvider } from "@/src/components/ui/tooltip";

export default function layout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <TooltipProvider>
          <div className="p-3 md:p-5 flex flex-1 flex-col">
            <div className="@container/main flex flex-1 flex-col gap-2">
              <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                {children}
              </div>
            </div>
          </div>
        </TooltipProvider>
      </SidebarInset>
    </SidebarProvider>
  );
}
