/**
 * Global not-found page.
 */
export default function NotFound() {
    return (
        <div className="flex min-h-dvh flex-col items-center justify-center gap-4 text-center">
            <div className="text-6xl font-bold text-foreground/10">404</div>
            <div>
                <h2 className="text-lg font-bold">Page Not Found</h2>
                <p className="mt-1 text-sm text-foreground/50">
                    The page you&apos;re looking for doesn&apos;t exist or has been moved.
                </p>
            </div>
            <a
                href="/"
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90"
            >
                Go Home
            </a>
        </div>
    );
}
