"use client";

import { useMemo, useRef, useState, useEffect, useCallback } from "react";
import { Chip, Avatar } from "@heroui/react";
import { Users } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import type { PollDTO } from "@/hooks/use-polls";
import { getPollTheme, getLuckyWinnerTheme, type PollTheme } from "./pollTheme";
import { getPrizeDistribution, getTeamSize } from "@/utils/prizeDistribution";

/* ─── Types ─────────────────────────────────────────────────── */

interface PollCardProps {
    poll: PollDTO;
    onVote: (pollId: string, vote: "IN" | "OUT" | "SOLO") => void;
    isVoting: boolean;
    currentPlayerId?: string;
    onRefetch?: () => void;
}

/* ─── Animated Counter ──────────────────────────────────────── */

function AnimatedCounter({ value }: { value: number }) {
    return (
        <motion.span
            key={value}
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
        >
            {value.toLocaleString()}
        </motion.span>
    );
}

/* ─── Prize Breakdown Tooltip ───────────────────────────────── */

function PrizeBreakdownTooltip({
    prizePool,
    entryFee,
    teamSize,
    theme,
    onDoubleTap,
}: {
    prizePool: number;
    entryFee: number;
    teamSize: number;
    theme: PollTheme;
    onDoubleTap?: () => void;
}) {
    const [isOpen, setIsOpen] = useState(false);
    const lastTapRef = useRef<number>(0);

    const handleTap = useCallback(() => {
        const now = Date.now();
        if (now - lastTapRef.current < 300) {
            onDoubleTap?.();
            lastTapRef.current = 0;
        } else {
            lastTapRef.current = now;
            setIsOpen((o) => !o);
        }
    }, [onDoubleTap]);

    return (
        <div
            className="absolute bottom-2 right-3"
            onMouseEnter={() => setIsOpen(true)}
            onMouseLeave={() => setIsOpen(false)}
        >
            <AnimatePresence mode="wait">
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 5, scale: 0.98 }}
                        transition={{ type: "spring", stiffness: 400, damping: 25 }}
                        className={`absolute bottom-0 right-full mr-2 z-50 rounded-lg px-4 py-2 text-sm shadow-2xl bg-gradient-to-br ${theme.header} max-h-48 overflow-y-auto`}
                    >
                        <div className="absolute inset-0 bg-black/10 rounded-lg" />
                        <div className="relative space-y-0.5 whitespace-nowrap text-white">
                            {(() => {
                                const distribution = getPrizeDistribution(prizePool, entryFee, teamSize);
                                const medals = ["🥇", "🥈", "🥉", "🏅", "🎖️"];
                                return Array.from(distribution.prizes.entries())
                                    .sort(([a], [b]) => a - b)
                                    .map(([position, prize]) => {
                                        const medal = medals[position - 1] || "🏅";
                                        const ordinal =
                                            position === 1 ? "st" : position === 2 ? "nd" : position === 3 ? "rd" : "th";
                                        return (
                                            <div key={position} className="flex items-center justify-between gap-4">
                                                <span>
                                                    {medal} {position}{ordinal}
                                                </span>
                                                <span className="font-semibold">
                                                    {prize.amount.toLocaleString()} UC
                                                </span>
                                            </div>
                                        );
                                    });
                            })()}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
            <button
                type="button"
                className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-white/25 hover:bg-white/40 active:bg-white/50 text-white text-xs font-bold cursor-pointer transition-all duration-200 shadow-sm hover:shadow-md hover:scale-110 backdrop-blur-sm border border-white/30"
                aria-label="View prize breakdown (double-tap to refresh)"
                onClick={handleTap}
            >
                ?
            </button>
        </div>
    );
}

/* ─── Wave SVG Background ───────────────────────────────────── */

function WaveBackground({ theme }: { theme: PollTheme }) {
    return (
        <>
            <div className={`absolute inset-0 bg-gradient-to-br ${theme.header}`} />
            <div className="absolute bottom-0 left-0 right-0 h-12 overflow-hidden">
                <svg
                    className="absolute bottom-0 w-[200%] h-12 animate-[wave_3s_ease-in-out_infinite]"
                    viewBox="0 0 1200 120"
                    preserveAspectRatio="none"
                >
                    <path
                        d="M0,60 C200,100 400,20 600,60 C800,100 1000,20 1200,60 L1200,120 L0,120 Z"
                        fill={theme.wave1}
                    />
                </svg>
                <svg
                    className="absolute bottom-0 w-[200%] h-10 animate-[wave_4s_ease-in-out_infinite_reverse]"
                    viewBox="0 0 1200 120"
                    preserveAspectRatio="none"
                >
                    <path
                        d="M0,60 C200,20 400,100 600,60 C800,20 1000,100 1200,60 L1200,120 L0,120 Z"
                        fill={theme.wave2}
                    />
                </svg>
            </div>
            {/* Sparkles */}
            <div className="absolute top-3 left-6 w-1 h-1 bg-white rounded-full animate-ping opacity-75" />
            <div
                className={`absolute top-4 right-8 w-1.5 h-1.5 ${theme.sparkle} rounded-full animate-ping opacity-60`}
                style={{ animationDelay: "0.5s" }}
            />
            <style jsx>{`
                @keyframes wave {
                    0%,
                    100% {
                        transform: translateX(0);
                    }
                    50% {
                        transform: translateX(-25%);
                    }
                }
            `}</style>
        </>
    );
}

/* ─── Poll Option ───────────────────────────────────────────── */

function PollOptionRow({
    label,
    isSelected,
    isLoading,
    disabled,
    voteCount,
    percentage,
    voters,
    theme,
    onClick,
}: {
    label: string;
    isSelected: boolean;
    isLoading: boolean;
    disabled: boolean;
    voteCount: number;
    percentage: number;
    voters: PollDTO["playersVotes"];
    theme: PollTheme | null;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={isLoading || disabled}
            className={`
                w-full text-left relative overflow-hidden group py-4 px-4 rounded-xl border-2
                transition-all duration-150 transform hover:scale-[1.01] active:scale-[0.99]
                ${isSelected
                    ? theme
                        ? `${theme.optionSelected.border} ${theme.optionSelected.bg} shadow-md`
                        : "border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md"
                    : theme
                        ? `${theme.optionUnselected.border} bg-white dark:bg-gray-800 hover:shadow-sm`
                        : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-blue-300 hover:shadow-sm"
                }
                ${isLoading ? "cursor-wait opacity-80" : "cursor-pointer"}
                ${disabled && !isLoading ? "opacity-60 cursor-not-allowed" : ""}
            `}
        >
            <div className="flex items-center justify-between">
                {/* Radio + Label */}
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <div
                        className={`
                            w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200 flex-shrink-0
                            ${isSelected
                                ? theme
                                    ? `${theme.optionSelected.radio} shadow-sm`
                                    : "border-blue-500 bg-blue-500 shadow-sm"
                                : theme
                                    ? theme.optionUnselected.radio
                                    : "border-gray-300 dark:border-gray-600"
                            }
                        `}
                    >
                        {isSelected && <div className="w-2.5 h-2.5 bg-white rounded-full" />}
                    </div>
                    <span
                        className={`font-medium text-base truncate block ${isSelected
                            ? theme
                                ? theme.optionSelected.text
                                : "text-blue-700 dark:text-blue-300"
                            : "text-gray-900 dark:text-white"
                            }`}
                    >
                        {label}
                    </span>
                    {isLoading && (
                        <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    )}
                </div>

                {/* Voter avatars + count */}
                {voteCount > 0 && (
                    <div className="flex items-center space-x-2 flex-shrink-0 ml-2">
                        {voters.length > 0 && (
                            <div className="flex -space-x-2">
                                {voters.slice(0, 2).map((v) => (
                                    <Avatar
                                        key={v.playerId}
                                        src={v.imageUrl}
                                        name={v.displayName}
                                        size="sm"
                                        className="w-6 h-6 border-2 border-white dark:border-gray-800"
                                    />
                                ))}
                            </div>
                        )}
                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            {voteCount}
                        </span>
                    </div>
                )}
            </div>

            {/* Progress bar */}
            {voteCount > 0 && (
                <div className="mt-3">
                    <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <motion.div
                            className={
                                isSelected
                                    ? theme
                                        ? `h-full rounded-full ${theme.optionSelected.radio}`
                                        : "h-full rounded-full bg-blue-500"
                                    : "h-full rounded-full bg-gray-400 dark:bg-gray-500"
                            }
                            initial={{ width: 0 }}
                            animate={{ width: `${percentage}%` }}
                            transition={{ duration: 0.5, ease: "easeOut" }}
                        />
                    </div>
                </div>
            )}
        </button>
    );
}

/* ─── Main Poll Card ────────────────────────────────────────── */

export function PollCard({ poll, onVote, isVoting, currentPlayerId, onRefetch }: PollCardProps) {
    const { tournament } = poll;

    // Marquee for long titles
    const titleRef = useRef<HTMLHeadingElement>(null);
    const [isTitleOverflowing, setIsTitleOverflowing] = useState(false);

    useEffect(() => {
        const el = titleRef.current;
        if (el) setIsTitleOverflowing(el.scrollWidth > el.clientWidth + 10);
    }, [poll.question]);

    // Participants = IN + SOLO
    const participantCount = poll.inVotes + poll.soloVotes;
    const entryFee = tournament?.fee ?? 0;
    const prizePool = entryFee * participantCount;
    const hasPrizePool = prizePool > 0;

    // Dynamic team type
    const effectiveTeamType = useMemo(() => {
        if (poll.teamType !== "DYNAMIC") return poll.teamType;
        if (participantCount < 48) return "DUO";
        if (participantCount < 60) return "TRIO";
        return "SQUAD";
    }, [poll.teamType, participantCount]);

    // Theme
    const isLuckyVoter = !!currentPlayerId && poll.luckyVoterId === currentPlayerId;
    const theme = isLuckyVoter
        ? getLuckyWinnerTheme()
        : hasPrizePool
            ? getPollTheme(participantCount)
            : null;

    // Get option names from DB, fall back to defaults
    const getOptionName = (vote: string) => {
        const opt = poll.options?.find((o: { vote: string; name: string }) => o.vote === vote);
        return opt?.name || (vote === "IN" ? "Nga Leh 😎" : vote === "OUT" ? "Leh rei, I'm ge 🏳️‍🌈" : "Nga Leh solo 🫩");
    };

    // Vote breakdown for each option (percentage relative to max)
    const options: { label: string; vote: "IN" | "OUT" | "SOLO"; count: number }[] = [
        { label: getOptionName("IN"), vote: "IN", count: poll.inVotes },
        { label: getOptionName("OUT"), vote: "OUT", count: poll.outVotes },
        { label: getOptionName("SOLO"), vote: "SOLO", count: poll.soloVotes },
    ];
    const maxCount = Math.max(...options.map((o) => o.count), 1);

    // Voters per option
    const votersByVote = useMemo(() => {
        const map: Record<string, typeof poll.playersVotes> = { IN: [], OUT: [], SOLO: [] };
        for (const v of poll.playersVotes) {
            if (map[v.vote]) map[v.vote].push(v);
        }
        return map;
    }, [poll.playersVotes]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="max-w-2xl mx-auto"
        >
            <div
                className={`relative rounded-xl overflow-hidden transition-all duration-700 ease-in-out ${theme
                    ? theme.card
                    : "bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700"
                    }`}
            >
                {/* ─── Header with Prize Pool ─── */}
                <div className={hasPrizePool ? "relative overflow-hidden" : ""}>
                    {theme && <WaveBackground theme={theme} />}

                    <div
                        className={`relative p-6 ${hasPrizePool ? "pb-8" : "border-b border-gray-100 dark:border-gray-700"}`}
                    >
                        {/* Title + Day badge */}
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0 overflow-hidden">
                                <div className="overflow-hidden">
                                    <h3
                                        ref={titleRef}
                                        className={`font-semibold text-lg whitespace-nowrap ${isTitleOverflowing ? "animate-marquee" : ""} ${hasPrizePool ? "text-white drop-shadow-md" : "text-gray-900 dark:text-white"}`}
                                        title={tournament?.name || poll.question}
                                    >
                                        {tournament?.name || poll.question}
                                    </h3>
                                </div>
                                <style jsx>{`
                                    @keyframes marquee {
                                        0%, 15% { transform: translateX(0%); }
                                        40%, 60% { transform: translateX(-30%); }
                                        85%, 100% { transform: translateX(0%); }
                                    }
                                    .animate-marquee {
                                        display: inline-block;
                                        animation: marquee 12s ease-in-out infinite;
                                    }
                                    @media (min-width: 640px) {
                                        .animate-marquee {
                                            animation: none;
                                            overflow: hidden;
                                            text-overflow: ellipsis;
                                            display: block;
                                        }
                                    }
                                `}</style>
                            </div>
                            {poll.days && (
                                <Chip
                                    size="sm"
                                    variant="flat"
                                    className={
                                        theme
                                            ? theme.badge
                                            : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200 animate-pulse"
                                    }
                                >
                                    {poll.days}
                                </Chip>
                            )}
                        </div>

                        {/* Prize Pool */}
                        {theme && (
                            <>
                                <div className="mt-3 flex items-center justify-center gap-3">
                                    <span className="text-3xl">🏆</span>
                                    <div className="text-center">
                                        <p className="text-xs font-medium text-white/80 uppercase tracking-widest">
                                            Prize Pool
                                        </p>
                                        <p className="text-2xl font-black text-white drop-shadow-lg inline-flex items-center">
                                            <AnimatedCounter value={prizePool} />
                                            <span className="ml-1">UC</span>
                                        </p>
                                    </div>
                                </div>
                                {/* Prize breakdown ? button */}
                                <PrizeBreakdownTooltip
                                    prizePool={prizePool}
                                    entryFee={entryFee}
                                    teamSize={effectiveTeamType === "SOLO" ? 1 : effectiveTeamType === "DUO" ? 2 : effectiveTeamType === "TRIO" ? 3 : 4}
                                    theme={theme}
                                    onDoubleTap={onRefetch}
                                />
                                {/* Team type badge */}
                                {effectiveTeamType && (
                                    <div className="absolute bottom-2 left-3">
                                        <Chip
                                            size="sm"
                                            className="font-bold bg-white/25 text-white border border-white/30 backdrop-blur-sm"
                                        >
                                            {effectiveTeamType}
                                        </Chip>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>

                {/* ─── Options ─── */}
                <div
                    className={`p-6 space-y-3 transition-all duration-700 ease-in-out ${theme ? theme.options : ""}`}
                >
                    {options.map((opt) => (
                        <PollOptionRow
                            key={opt.vote}
                            label={opt.label}
                            isSelected={poll.userVote === opt.vote}
                            isLoading={isVoting && poll.userVote !== opt.vote}
                            disabled={!poll.isActive}
                            voteCount={opt.count}
                            percentage={Math.round((opt.count / maxCount) * 100)}
                            voters={votersByVote[opt.vote] ?? []}
                            theme={theme}
                            onClick={() => {
                                if (poll.userVote !== opt.vote) onVote(poll.id, opt.vote);
                            }}
                        />
                    ))}
                </div>

                {/* ─── Footer ─── */}
                {poll.totalVotes > 0 && (
                    <div
                        className={`px-6 pb-6 transition-all duration-700 ease-in-out ${theme ? theme.footer : ""}`}
                    >
                        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                            <span className="flex items-center space-x-1">
                                <Users className="w-4 h-4" />
                                <span>
                                    {poll.totalVotes} vote{poll.totalVotes !== 1 ? "s" : ""}
                                </span>
                            </span>
                            <span className="text-xs">
                                {isLuckyVoter && entryFee > 0 ? (
                                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                                        🎉 FREE ENTRY:{" "}
                                        <span className="line-through opacity-60">{entryFee}</span> 0
                                        UC
                                    </span>
                                ) : entryFee > 0 ? (
                                    `Entry: ${entryFee} UC`
                                ) : (
                                    "Free Entry"
                                )}
                            </span>
                        </div>
                    </div>
                )}
            </div>
        </motion.div>
    );
}
