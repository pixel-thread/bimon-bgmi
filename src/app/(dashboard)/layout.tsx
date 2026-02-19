import { requireAdmin } from "@/lib/auth";
import { AdminSidebar } from "@/components/layout/admin-sidebar";

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
        <div className="flex min-h-dvh">
            <AdminSidebar />
            <div className="flex flex-1 flex-col">
                <header className="flex h-14 items-center border-b border-divider px-4 lg:px-6">
                    <h1 className="text-base font-semibold">Admin Panel</h1>
                </header>
                <main className="flex-1 p-4 md:p-6">{children}</main>
            </div>
        </div>
    );
}
