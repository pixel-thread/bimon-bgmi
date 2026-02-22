import { requireAdmin } from "@/lib/auth";
import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { Header } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";

/**
 * Route group: (dashboard)
 * Admin-only pages — tournament management, analytics, settings.
 * Protected by server-side auth check + sidebar layout.
 */
export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // Server-side admin check — throws if not admin
    await requireAdmin();

    return (
        <div className="flex min-h-dvh flex-col">
            {/* Mobile header with hamburger — hidden on desktop */}
            <div className="lg:hidden">
                <Header />
            </div>
            <div className="flex flex-1 pt-16 lg:pt-0">
                <AdminSidebar />
                <div className="flex flex-1 flex-col">
                    <header className="hidden h-14 items-center border-b border-divider px-4 lg:flex lg:px-6">
                        <h1 className="text-base font-semibold">Admin Panel</h1>
                    </header>
                    <main className="flex-1 p-4 pb-20 sm:pb-4 md:p-6">{children}</main>
                </div>
            </div>
            <MobileNav />
        </div>
    );
}

