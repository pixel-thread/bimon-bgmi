export default function OfflinePage() {
    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                minHeight: "100dvh",
                textAlign: "center",
                padding: "2rem",
                fontFamily: "Inter, system-ui, sans-serif",
                background: "linear-gradient(180deg, #18181b 0%, #0a0a0a 100%)",
                color: "#fafafa",
            }}
        >
            <div
                style={{
                    width: "64px",
                    height: "64px",
                    borderRadius: "50%",
                    background: "rgba(255,255,255,0.05)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: "1.5rem",
                    fontSize: "28px",
                }}
            >
                📡
            </div>
            <h1
                style={{
                    fontSize: "1.5rem",
                    fontWeight: 700,
                    margin: "0 0 0.5rem",
                }}
            >
                You&apos;re Offline
            </h1>
            <p
                style={{
                    color: "rgba(250,250,250,0.5)",
                    fontSize: "0.875rem",
                    maxWidth: "300px",
                    lineHeight: 1.6,
                }}
            >
                Check your internet connection and try again. Your data is safe —
                we&apos;ll sync when you&apos;re back online.
            </p>
            <button
                onClick={() => window.location.reload()}
                style={{
                    marginTop: "1.5rem",
                    padding: "0.625rem 1.5rem",
                    borderRadius: "0.75rem",
                    background: "hsl(212, 100%, 48%)",
                    color: "#fff",
                    border: "none",
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    cursor: "pointer",
                }}
            >
                Try Again
            </button>
        </div>
    );
}
