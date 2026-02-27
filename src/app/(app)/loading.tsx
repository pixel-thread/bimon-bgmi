"use client";

import { PubgmiLogo } from "@/components/common/pubgmi-logo";

/**
 * Loading state for the app route group.
 * Shows the branded PUBGMI glitch animation + bouncing progress bar.
 */
export default function AppLoading() {
    return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-5">
            <PubgmiLogo variant="hero" className="text-3xl text-foreground/30" />
            <div className="h-[2px] w-28 overflow-hidden rounded-full bg-foreground/10">
                <div
                    className="h-full w-1/3 rounded-full bg-foreground/25"
                    style={{
                        animation: "loaderBounce 1.4s ease-in-out infinite alternate",
                    }}
                />
            </div>
            <style>{`
                @keyframes loaderBounce {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(200%); }
                }
            `}</style>
        </div>
    );
}
