"use client";

/**
 * Global error boundary for the dashboard route group.
 */
export default function DashboardError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-danger/10 text-3xl">
                🔧
            </div>
            <div>
                <h2 className="text-lg font-bold">Dashboard Error</h2>
                <p className="mt-1 text-sm text-foreground/50">
                    {error.message || "An unexpected error occurred"}
                </p>
            </div>
            <button
                onClick={reset}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90"
            >
                Try again
            </button>
        </div>
    );
}
