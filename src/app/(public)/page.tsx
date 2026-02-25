import { Swords } from "lucide-react";
import Link from "next/link";
import { HeroCTA, HeroHeading } from "@/components/landing/hero-cta";
import { LastRouteRedirector } from "@/components/common/last-route-redirector";

/**
 * Public landing page — / route.
 */
export default function HomePage() {
    return (
        <div className="min-h-dvh bg-background text-foreground">
            <LastRouteRedirector />
            {/* Hero */}
            <section className="relative overflow-hidden px-4 pb-20 pt-20 sm:px-6 sm:pt-28">
                {/* Animated background blobs */}
                <div className="absolute left-1/4 top-20 -z-10 h-72 w-72 rounded-full bg-blue-600/20 blur-[100px]" />
                <div className="absolute right-1/4 top-40 -z-10 h-60 w-60 rounded-full bg-violet-600/20 blur-[100px]" />
                <div className="absolute bottom-0 left-1/2 -z-10 h-40 w-[600px] -translate-x-1/2 rounded-full bg-cyan-600/10 blur-[80px]" />

                <div className="mx-auto max-w-2xl text-center">
                    <div className="inline-flex items-center gap-2 rounded-full border border-foreground/10 bg-foreground/5 px-4 py-1.5 text-xs font-medium text-foreground/60 backdrop-blur-sm">
                        <Swords className="h-3.5 w-3.5 text-blue-400" />
                        BGMI Community Platform
                    </div>

                    <HeroHeading />

                    <p className="mx-auto mt-5 max-w-lg text-lg leading-relaxed text-foreground/50">
                        Join organized BGMI tournaments with skill-balanced teams,
                        UC prize pools, and real-time stat tracking.
                    </p>

                    <div className="mt-10 flex items-center justify-center gap-4">
                        <HeroCTA />
                        <Link
                            href="/rules"
                            className="inline-flex items-center rounded-xl border border-foreground/10 bg-foreground/5 px-7 py-3 text-sm font-medium text-foreground/70 backdrop-blur-sm transition-all hover:border-foreground/20 hover:bg-foreground/10 hover:text-foreground"
                        >
                            View Rules
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}
