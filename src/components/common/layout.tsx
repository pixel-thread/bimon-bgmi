"use client";
import { useAuth } from "@/src/hooks/useAuth";
import { Header } from "./header";
import Footer from "./Footer";
import { TooltipProvider } from "../ui/tooltip";
import { usePathname } from "next/navigation";

export const Layout = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const isAdminRoute = pathname.startsWith("/admin");

  if (isAdminRoute) return <>{children}</>;

  return (
    <>
      <Header />
      <TooltipProvider>{children}</TooltipProvider>
      <Footer />
    </>
  );
};
