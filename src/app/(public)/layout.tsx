import { Header } from "@/components/layout/header";

/**
 * Route group: (public)
 * Unauthenticated pages — home, about, FAQ, recent matches.
 * Uses the same shared Header as app pages for consistency.
 */
export default function PublicLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <>
            <Header />
            {children}
        </>
    );
}
