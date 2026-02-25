import { Header } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";
import { OnboardingGuard } from "@/components/common/OnboardingGuard";
import { SwipeNavigator } from "@/components/common/swipe-navigator";

/**
 * Route group: (app)
 * Authenticated user pages — players, vote, profile, wallet.
 * Shows the main header and bottom mobile nav.
 * Redirects non-onboarded users to /onboarding.
 * Supports Instagram-like swipe navigation between tabs on mobile.
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
                <main className="flex-1 pt-16 pb-16 lg:pb-0">{children}</main>
                <MobileNav />
                <SwipeNavigator />
            </div>
        </OnboardingGuard>
    );
}
