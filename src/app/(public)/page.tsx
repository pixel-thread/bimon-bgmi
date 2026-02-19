import {
    Gamepad2,
    Trophy,
    Users,
    BarChart3,
    Flame,
    Shield,
    ChevronRight,
    Swords,
} from "lucide-react";
import Link from "next/link";

const features = [
    {
        icon: Gamepad2,
        title: "Tournament System",
        description: "Compete in organized BGMI tournaments with balanced teams",
        color: "text-primary",
    },
    {
        icon: Trophy,
        title: "Prize Pool",
        description: "Win UC rewards distributed to top-performing teams",
        color: "text-warning",
    },
    {
        icon: Users,
        title: "Smart Matching",
        description: "Auto-balanced teams based on skill tiers and K/D ratios",
        color: "text-success",
    },
    {
        icon: BarChart3,
        title: "Live Stats",
        description: "Track your kills, deaths, matches, and K/D progression",
        color: "text-secondary",
    },
    {
        icon: Flame,
        title: "Streak Rewards",
        description: "Play consecutive tournaments to unlock streak bonuses",
        color: "text-orange-500",
    },
    {
        icon: Shield,
        title: "Merit System",
        description: "Rate teammates and build your reputation score",
        color: "text-primary",
    },
];

/**
 * Public landing page — / route.
 * Clean, fast, informative.
 */
export default function HomePage() {
    return (
        <div className="min-h-dvh">
            {/* Hero */}
            <section className="relative overflow-hidden px-4 pb-16 pt-20 sm:px-6 sm:pt-28">
                {/* Background gradient */}
                <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/5 via-background to-background" />
                <div className="absolute left-1/2 top-0 -z-10 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-primary/5 blur-3xl" />

                <div className="mx-auto max-w-2xl text-center">
                    <div className="inline-flex items-center gap-2 rounded-full border border-divider bg-background/50 px-3 py-1 text-xs backdrop-blur-sm">
                        <Swords className="h-3 w-3 text-primary" />
                        <span className="text-foreground/60">BGMI Community Platform</span>
                    </div>

                    <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-5xl">
                        Compete.{" "}
                        <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                            Track.
                        </span>{" "}
                        Dominate.
                    </h1>

                    <p className="mt-4 text-lg text-foreground/50">
                        Join organized BGMI tournaments with skill-balanced teams,
                        UC prize pools, and real-time stat tracking.
                    </p>

                    <div className="mt-8 flex items-center justify-center gap-3">
                        <Link
                            href="/sign-up"
                            className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/25"
                        >
                            Get Started
                            <ChevronRight className="h-4 w-4" />
                        </Link>
                        <Link
                            href="/rules"
                            className="inline-flex items-center rounded-xl border border-divider px-6 py-2.5 text-sm font-medium transition-colors hover:bg-default-100"
                        >
                            View Rules
                        </Link>
                    </div>
                </div>
            </section>

            {/* Features */}
            <section className="border-t border-divider px-4 py-16 sm:px-6">
                <div className="mx-auto max-w-4xl">
                    <h2 className="mb-8 text-center text-2xl font-bold">
                        Everything you need to compete
                    </h2>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {features.map((f) => (
                            <div
                                key={f.title}
                                className="group rounded-xl border border-divider bg-background/50 p-5 transition-all hover:border-primary/30 hover:shadow-sm"
                            >
                                <f.icon className={`h-6 w-6 ${f.color}`} />
                                <h3 className="mt-3 text-sm font-semibold">{f.title}</h3>
                                <p className="mt-1 text-xs leading-relaxed text-foreground/50">
                                    {f.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="border-t border-divider px-4 py-16 sm:px-6">
                <div className="mx-auto max-w-md text-center">
                    <h2 className="text-xl font-bold">Ready to play?</h2>
                    <p className="mt-2 text-sm text-foreground/50">
                        Create your account and join the next tournament.
                    </p>
                    <Link
                        href="/sign-up"
                        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-3 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/25"
                    >
                        Join Now
                        <ChevronRight className="h-4 w-4" />
                    </Link>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-divider px-4 py-6 sm:px-6">
                <div className="mx-auto flex max-w-4xl items-center justify-between text-xs text-foreground/40">
                    <span>PUBGMI Community</span>
                    <div className="flex gap-4">
                        <Link href="/rules" className="hover:text-foreground/60">
                            Rules
                        </Link>
                        <Link
                            href="/recent-matches"
                            className="hover:text-foreground/60"
                        >
                            Matches
                        </Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
