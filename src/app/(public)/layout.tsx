/**
 * Route group: (public)
 * Unauthenticated pages — home, about, FAQ, recent matches.
 * No header/sidebar, clean minimal layout.
 */
export default function PublicLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
