"use client";

import { useEffect, useState } from "react";
import { WifiOff, RefreshCw, AlertTriangle, Copy, Check } from "lucide-react";

/**
 * Global error boundary for the app route group.
 * Clean UI for users, but still shows error detail for dev debugging via screenshots.
 */
export default function AppError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    const [retrying, setRetrying] = useState(false);
    const [copied, setCopied] = useState(false);

    const isChunkError =
        error.message?.includes("Failed to load") ||
        error.message?.includes("Loading chunk") ||
        error.message?.includes("ChunkLoadError") ||
        error.message?.includes("dynamically imported module");

    const isOffline = typeof navigator !== "undefined" && !navigator.onLine;

    useEffect(() => {
        const handleOnline = () => reset();
        window.addEventListener("online", handleOnline);
        return () => window.removeEventListener("online", handleOnline);
    }, [reset]);

    const handleRetry = () => {
        setRetrying(true);
        if (isChunkError) { window.location.reload(); return; }
        setTimeout(() => { reset(); setRetrying(false); }, 500);
    };

    const errorDetail = error.message || "Unknown error";
    const handleCopy = () => {
        navigator.clipboard?.writeText(errorDetail);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-5 px-6 text-center">
            <div className={`flex h-16 w-16 items-center justify-center rounded-2xl ${
                isChunkError || isOffline ? "bg-warning/10" : "bg-danger/10"
            }`}>
                {isChunkError || isOffline ? (
                    <WifiOff className="h-7 w-7 text-warning" />
                ) : (
                    <AlertTriangle className="h-7 w-7 text-danger" />
                )}
            </div>

            <div className="space-y-1.5">
                <h2 className="text-lg font-bold">
                    {isOffline ? "You're offline" : isChunkError ? "Connection issue" : "Something went wrong"}
                </h2>
                <p className="text-sm text-foreground/50 max-w-xs mx-auto leading-relaxed">
                    {isOffline
                        ? "Check your internet connection and try again."
                        : isChunkError
                            ? "The page couldn't load fully. This usually happens on slow networks."
                            : "An unexpected error occurred. Please try again."}
                </p>
            </div>

            <button
                onClick={handleRetry}
                disabled={retrying}
                className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-primary/90 active:scale-95 disabled:opacity-60"
            >
                <RefreshCw className={`h-4 w-4 ${retrying ? "animate-spin" : ""}`} />
                {retrying ? "Retrying…" : "Try again"}
            </button>

            {(isOffline || isChunkError) && (
                <p className="text-[11px] text-foreground/30">
                    Will retry automatically when connection improves
                </p>
            )}

            {/* Error detail — subtle but visible in screenshots for dev debugging */}
            <div className="mt-4 w-full max-w-sm">
                <div className="flex items-center justify-between rounded-lg bg-foreground/[0.03] border border-foreground/[0.06] px-3 py-2">
                    <p className="text-[10px] text-foreground/25 text-left truncate mr-2 font-mono">
                        {errorDetail.length > 120 ? errorDetail.slice(0, 120) + "…" : errorDetail}
                    </p>
                    <button onClick={handleCopy} className="shrink-0 p-1 rounded hover:bg-foreground/5 transition-colors">
                        {copied
                            ? <Check className="h-3 w-3 text-success" />
                            : <Copy className="h-3 w-3 text-foreground/20" />}
                    </button>
                </div>
            </div>
        </div>
    );
}
