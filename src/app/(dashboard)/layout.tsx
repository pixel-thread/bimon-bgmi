import { requireAdmin } from "@/lib/auth";
import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { Header } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";
import { redirect } from "next/navigation";

/**
 * Route group: (dashboard)
 * Admin-only pages — tournament management, analytics, settings.
 * Protected by server-side auth check + sidebar layout.
 *
 * Wrapped in try-catch because layout-level errors bypass error.tsx
 * boundaries, causing the raw "Application error" page on cold starts.
 */
export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // Server-side admin check with retry for cold-start resilience
    let retries = 1;
    let lastError: unknown;
    while (retries >= 0) {
        try {
            await requireAdmin();
            break;
        } catch (e: unknown) {
            // redirect() throws a special NEXT_REDIRECT error — let it through
            if (e instanceof Error && e.message === "NEXT_REDIRECT") throw e;
            // Check for Next.js internal redirect (has a digest property)
            if (typeof e === "object" && e !== null && "digest" in e) throw e;
            lastError = e;
            retries--;
            if (retries >= 0) {
                // Wait briefly before retry (cold-start recovery)
                await new Promise((r) => setTimeout(r, 500));
            }
        }
    }
    // If all retries failed, redirect to sign-in instead of crashing
    if (lastError && retries < 0) {
        redirect("/sign-in");
    }

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

