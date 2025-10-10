"use cleint";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { useAuth } from "@/src/hooks/useAuth";
import { Header } from "./header";
import Footer from "./Footer";

export const Layout = ({ children }: { children: React.ReactNode }) => {
  const { user, isSignedIn } = useAuth();
  if (user?.role === "SUPER_ADMIN" && isSignedIn) {
    return (
      <SidebarProvider>
        <AppSidebar variant="inset" />
        <SidebarInset>
          <SiteHeader />
          <div className="p-3 md:p-5 flex flex-1 flex-col">
            <div className="@container/main flex flex-1 flex-col gap-2">
              <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                {children}
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  return (
    <>
      <Header />
      {children}
      <Footer />
    </>
  );
};
