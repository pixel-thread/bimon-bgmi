/**
 * Instant loading skeleton for /players — rendered server-side
 * so there's no blank flash before React hydrates.
 */
export default function PlayersLoading() {
    return (
        <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
            <div className="space-y-6">
                {/* Filter bar skeleton */}
                <div className="flex gap-2">
                    <div className="h-10 flex-1 animate-pulse rounded-xl bg-default-200" />
                    <div className="h-10 w-24 animate-pulse rounded-xl bg-default-200" />
                    <div className="h-10 w-24 animate-pulse rounded-xl bg-default-200" />
                </div>

                {/* Podium skeleton */}
                <div className="flex items-end justify-center gap-3 py-4 sm:gap-6 sm:py-6">
                    <div className="h-36 w-20 animate-pulse rounded-2xl bg-default-200 sm:h-44 sm:w-28" />
                    <div className="h-44 w-24 animate-pulse rounded-2xl bg-default-200 sm:h-52 sm:w-32" />
                    <div className="h-36 w-20 animate-pulse rounded-2xl bg-default-200 sm:h-44 sm:w-28" />
                </div>

                {/* Table rows skeleton */}
                <div className="space-y-2">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div
                            key={i}
                            className="flex items-center gap-3 rounded-lg px-4 py-2.5"
                        >
                            <div className="h-4 w-8 animate-pulse rounded bg-default-200" />
                            <div className="h-9 w-9 shrink-0 animate-pulse rounded-full bg-default-200" />
                            <div className="flex-1 space-y-1.5">
                                <div className="h-3.5 w-28 animate-pulse rounded bg-default-200" />
                                <div className="h-2.5 w-20 animate-pulse rounded bg-default-200 sm:hidden" />
                            </div>
                            <div className="hidden h-3.5 w-12 animate-pulse rounded bg-default-200 sm:block" />
                            <div className="hidden h-3.5 w-12 animate-pulse rounded bg-default-200 sm:block" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
