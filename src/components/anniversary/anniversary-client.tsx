"use client";

import { useEffect, useRef, useState } from "react";
import "./anniversary.css";

/* ─────────────────────────────────────
   TYPES
   ───────────────────────────────────── */

export interface AnniversaryData {
    stats: {
        daysActive: number;
        totalPlayers: number;
        totalTournaments: number;
        totalKills: number;
        totalMatches: number;
        totalTeams: number;
    };
    season1Players: { name: string; active: boolean }[];
    topKillers: { name: string; kills: number; tournaments: number }[];
    mostActive: { name: string; matches: number; tournaments: number }[];
    seasons: {
        name: string;
        period: string;
        tournaments: number;
        desc: string;
        highlight: string;
    }[];
}

/* ─────────────────────────────────────
   HOOKS
   ───────────────────────────────────── */

function useCountUp(target: number, duration = 2000) {
    const [count, setCount] = useState(0);
    const [started, setStarted] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !started) setStarted(true);
            },
            { threshold: 0.3 }
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, [started]);

    useEffect(() => {
        if (!started) return;
        const start = performance.now();
        const step = (now: number) => {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(eased * target));
            if (progress < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
    }, [started, target, duration]);

    return { count, ref };
}

function useReveal() {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add("ann-visible");
                    }
                });
            },
            { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
        );

        const children = el.querySelectorAll(".ann-reveal");
        children.forEach((child) => observer.observe(child));
        if (el.classList.contains("ann-reveal")) observer.observe(el);

        return () => observer.disconnect();
    }, []);

    return ref;
}

/* ─────────────────────────────────────
   COMPONENTS
   ───────────────────────────────────── */

/** Clean up legacy usernames for display: "legacy_jones_1" → "jones" */
function displayName(username: string): string {
    if (username.startsWith("legacy_")) {
        return username.replace(/^legacy_/, "").replace(/_\d+$/, "");
    }
    return username;
}

function Particles() {
    const particles = Array.from({ length: 20 }, (_, i) => ({
        id: i,
        left: `${Math.random() * 100}%`,
        top: `${60 + Math.random() * 40}%`,
        delay: `${Math.random() * 6}s`,
        size: `${2 + Math.random() * 3}px`,
    }));

    return (
        <>
            {particles.map((p) => (
                <div
                    key={p.id}
                    className="ann-particle"
                    style={{
                        left: p.left,
                        top: p.top,
                        animationDelay: p.delay,
                        width: p.size,
                        height: p.size,
                    }}
                />
            ))}
        </>
    );
}

function StatCard({ value, label }: { value: number; label: string }) {
    const { count, ref } = useCountUp(value);
    return (
        <div className="ann-stat-card ann-reveal" ref={ref}>
            <div className="ann-stat-value">
                {count.toLocaleString()}
                {value >= 10000 ? "+" : ""}
            </div>
            <div className="ann-stat-label">{label}</div>
        </div>
    );
}

function PlayerRow({
    rank,
    name,
    stat,
    statLabel,
}: {
    rank: number;
    name: string;
    stat: number;
    statLabel: string;
}) {
    return (
        <div className="ann-player-row">
            <div className="ann-player-rank" data-rank={rank <= 3 ? rank : undefined}>
                {rank}
            </div>
            <div className="ann-player-name">{name}</div>
            <div>
                <span className="ann-player-stat">{stat.toLocaleString()}</span>
                <span className="ann-player-stat-label">{statLabel}</span>
            </div>
        </div>
    );
}

/* ─────────────────────────────────────
   MAIN PAGE
   ───────────────────────────────────── */

export default function AnniversaryClient({ data }: { data: AnniversaryData }) {
    const { stats, season1Players, topKillers, mostActive, seasons } = data;

    const statsRef = useReveal();
    const killersRef = useReveal();
    const s1Ref = useReveal();
    const missRef = useReveal();
    const timelineRef = useReveal();

    const activeS1 = season1Players.filter((p) => p.active);
    const missedS1 = season1Players.filter((p) => !p.active);

    return (
        <div className="anniversary">
            {/* ══════ HERO ══════ */}
            <section className="ann-hero">
                <Particles />
                <div className="ann-hero-content">
                    <div className="ann-hero-badge">⚔️ BGMI Community</div>
                    <div className="ann-hero-number">1</div>
                    <div className="ann-hero-label">Year</div>
                    <p className="ann-hero-sub">
                        From a small group of friends to a thriving community.
                        <br />
                        Thank you for every match, every kill, every moment.
                    </p>
                    <div className="ann-hero-date">
                        <span>March 2025</span>
                        <span className="ann-hero-date-arrow">→</span>
                        <span>April 2026</span>
                    </div>
                </div>
            </section>

            {/* ══════ STATS ══════ */}
            <section className="ann-section" ref={statsRef}>
                <div className="ann-section-header">
                    <div className="ann-section-icon">📊</div>
                    <h2 className="ann-section-title">By the Numbers</h2>
                    <p className="ann-section-subtitle">
                        One year of tournaments, battles, and memories —
                        every stat from Day 1 to today.
                    </p>
                </div>
                <div className="ann-stats-grid ann-stagger">
                    <StatCard value={stats.daysActive} label="Days Active" />
                    <StatCard value={stats.totalPlayers} label="Players" />
                    <StatCard value={stats.totalTournaments} label="Tournaments" />
                    <StatCard value={stats.totalKills} label="Kills" />
                    <StatCard value={stats.totalMatches} label="Matches Played" />
                    <StatCard value={stats.totalTeams} label="Teams Formed" />
                </div>
            </section>

            <div className="ann-divider" />

            {/* ══════ TOP PLAYERS ══════ */}
            <section className="ann-section" ref={killersRef}>
                <div className="ann-section-header">
                    <div className="ann-section-icon">🏆</div>
                    <h2 className="ann-section-title">Hall of Fame</h2>
                    <p className="ann-section-subtitle">
                        The deadliest and most dedicated warriors of all time.
                    </p>
                </div>
                <div className="ann-leaderboard ann-stagger">
                    <div className="ann-leaderboard-group ann-reveal">
                        <div className="ann-leaderboard-title">🎯 Top Killers — All Time</div>
                        {topKillers.map((p, i) => (
                            <PlayerRow
                                key={p.name}
                                rank={i + 1}
                                name={p.name}
                                stat={p.kills}
                                statLabel="kills"
                            />
                        ))}
                    </div>
                    <div className="ann-leaderboard-group ann-reveal">
                        <div className="ann-leaderboard-title">
                            💪 Iron Warriors — Most Matches
                        </div>
                        {mostActive.map((p, i) => (
                            <PlayerRow
                                key={p.name}
                                rank={i + 1}
                                name={p.name}
                                stat={p.matches}
                                statLabel="matches"
                            />
                        ))}
                    </div>
                </div>
            </section>

            <div className="ann-divider" />

            {/* ══════ SEASON 1 VETERANS ══════ */}
            <section className="ann-section" ref={s1Ref}>
                <div className="ann-section-header">
                    <div className="ann-section-icon">⭐</div>
                    <h2 className="ann-section-title">Season 1 Veterans</h2>
                    <p className="ann-section-subtitle">
                        {season1Players.length} warriors who were part of Season 1.
                        {" "}{activeS1.length} are still playing today — that&rsquo;s loyalty.
                    </p>
                </div>
                <div className="ann-og-grid ann-stagger">
                    {activeS1.map((p) => (
                        <div
                            key={p.name}
                            className="ann-og-card ann-reveal"
                            data-day1="true"
                        >
                            <div className="ann-og-badge">S1 Veteran</div>
                            <div className="ann-og-name">{displayName(p.name)}</div>
                            <div className="ann-og-date">Still going strong 💪</div>
                        </div>
                    ))}
                </div>
            </section>

            <div className="ann-divider" />

            {/* ══════ WE MISS YOU ══════ */}
            <section className="ann-miss-section" ref={missRef}>
                <div className="ann-miss-header">
                    <div className="ann-section-icon">💔</div>
                    <h2 className="ann-miss-title">We Miss You</h2>
                    <p className="ann-miss-subtitle">
                        &ldquo;These warriors fought alongside us in Season 1
                        but haven&rsquo;t returned since. Their seats are empty now,
                        but they&rsquo;ll always be part of our story.
                        If you see this — come back, we saved your spot.&rdquo;
                    </p>
                </div>
                <div className="ann-miss-grid ann-stagger">
                    {missedS1.map((p) => (
                        <div key={p.name} className="ann-miss-card ann-reveal">
                            <div className="ann-miss-name">{displayName(p.name)}</div>
                            <div className="ann-miss-tag">
                                Gone since S1
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            <div className="ann-divider" />

            {/* ══════ TIMELINE ══════ */}
            <section className="ann-section" ref={timelineRef}>
                <div className="ann-section-header">
                    <div className="ann-section-icon">📅</div>
                    <h2 className="ann-section-title">Our Journey</h2>
                    <p className="ann-section-subtitle">
                        From a small idea to a full-fledged tournament
                        platform — here&rsquo;s how we got here.
                    </p>
                </div>
                <div className="ann-timeline">
                    {seasons.map((s) => (
                        <div key={s.name} className="ann-timeline-item ann-reveal">
                            <div className="ann-timeline-dot" />
                            <div className="ann-timeline-date">{s.period}</div>
                            <div className="ann-timeline-title">{s.name}</div>
                            <div className="ann-timeline-desc">{s.desc}</div>
                            <span className="ann-timeline-stat">
                                🏟️ {s.tournaments} tournaments
                            </span>
                            <span className="ann-timeline-stat">
                                ⭐ {s.highlight}
                            </span>
                        </div>
                    ))}
                </div>
            </section>

            {/* ══════ FOOTER ══════ */}
            <footer className="ann-footer">
                <p>
                    Built with <span className="ann-footer-heart">❤️</span> for
                    the BGMI community
                </p>
                <p style={{ marginTop: "0.5rem", opacity: 0.5 }}>
                    March 24, 2025 — Forever
                </p>
            </footer>
        </div>
    );
}
