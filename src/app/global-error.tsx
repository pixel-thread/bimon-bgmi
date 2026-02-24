"use client";

/**
 * Root-level error boundary — catches errors that happen in the root layout
 * or outside route-group error boundaries.
 * This prevents the raw Next.js "Application error" page from showing.
 */
export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <html lang="en">
            <body
                style={{
                    margin: 0,
                    fontFamily:
                        '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    backgroundColor: "#0a0a0a",
                    color: "#e5e5e5",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minHeight: "100dvh",
                }}
            >
                <div style={{ textAlign: "center", padding: "2rem" }}>
                    <div
                        style={{
                            fontSize: "3rem",
                            marginBottom: "1rem",
                        }}
                    >
                        ⚡
                    </div>
                    <h2
                        style={{
                            fontSize: "1.25rem",
                            fontWeight: 700,
                            margin: "0 0 0.5rem",
                        }}
                    >
                        Something went wrong
                    </h2>
                    <p
                        style={{
                            fontSize: "0.875rem",
                            color: "#a3a3a3",
                            margin: "0 0 1.5rem",
                        }}
                    >
                        {error.message || "An unexpected error occurred"}
                    </p>
                    <button
                        onClick={reset}
                        style={{
                            backgroundColor: "#3b82f6",
                            color: "#fff",
                            border: "none",
                            borderRadius: "0.5rem",
                            padding: "0.625rem 1.5rem",
                            fontSize: "0.875rem",
                            fontWeight: 500,
                            cursor: "pointer",
                        }}
                    >
                        Try again
                    </button>
                </div>
            </body>
        </html>
    );
}
