import { Header } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";
import { OnboardingGuard } from "@/components/common/OnboardingGuard";

/**
 * Route group: (app)
 * Authenticated user pages — players, vote, profile, wallet.
 * Shows the main header and bottom mobile nav.
 * Redirects non-onboarded users to /onboarding.
 */
export default function AppLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <OnboardingGuard>
            <div className="flex min-h-dvh flex-col">
                <Header />
                <main className="flex-1 pt-16 pb-16 sm:pb-0">{children}</main>
                <MobileNav />
            </div>
        </OnboardingGuard>
    );
}
