"use client";

import { Card, CardBody, CardHeader, Divider } from "@heroui/react";
import {
    BookOpen,
    Shield,
    AlertTriangle,
    Trophy,
    Coins,
    Users,
    Star,
    Flame,
} from "lucide-react";
import { motion } from "motion/react";

const sections = [
    {
        title: "Tournament Rules",
        icon: Trophy,
        color: "text-warning",
        rules: [
            "Players must vote IN on the poll to participate",
            "Teams are generated automatically based on skill balancing",
            "Entry fee is deducted from your UC wallet before the match",
            "Matches are played on the scheduled day and time",
            "Screenshots of scoreboard must be submitted after each match",
        ],
    },
    {
        title: "Scoring System",
        icon: Star,
        color: "text-primary",
        rules: [
            "K/D ratio is calculated from total kills and deaths across all matches",
            "Player category (tier) is assigned based on performance over time",
            "Categories range from BOT to LEGEND",
            "Stats are tracked per season and cumulatively",
        ],
    },
    {
        title: "UC Economy",
        icon: Coins,
        color: "text-success",
        rules: [
            "UC is the in-game virtual currency for tournaments",
            "Entry fees are collected before tournament start",
            "Prize pool is distributed to winning teams",
            "UC can be transferred between players (with admin approval)",
            "Negative balances are tracked and must be settled",
        ],
    },
    {
        title: "Streaks & Rewards",
        icon: Flame,
        color: "text-orange-500",
        rules: [
            "Play consecutive tournaments to build your streak",
            "Royal Pass holders receive bonus rewards at streak milestones",
            "Streak resets if you miss a tournament",
            "Solo support bonuses are available for solo players",
        ],
    },
    {
        title: "Fair Play",
        icon: Shield,
        color: "text-secondary",
        rules: [
            "No cheating, hacking, or exploiting game bugs",
            "Respect all players and admins",
            "Merit ratings are given after each tournament — be a good teammate",
            "Low merit scores may result in penalties",
        ],
    },
    {
        title: "Bans & Penalties",
        icon: AlertTriangle,
        color: "text-danger",
        rules: [
            "Players can be banned for rule violations",
            "Banned players cannot participate in tournaments",
            "Ban duration is determined by severity of the offense",
            "Appeals can be made through admin contact",
        ],
    },
    {
        title: "Teams",
        icon: Users,
        color: "text-foreground/60",
        rules: [
            "Teams are auto-generated for balanced matches",
            "Team types: Solo, Duo, Trio, Squad",
            "Back-to-back teammate pairing is avoided when possible",
            "Team assignments are final once generated",
        ],
    },
];

/**
 * /rules — Game and tournament rules.
 */
export default function RulesPage() {
    return (
        <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
            <div className="mb-6 space-y-1">
                <div className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-primary" />
                    <h1 className="text-lg font-bold">Rules & Guidelines</h1>
                </div>
                <p className="text-sm text-foreground/50">
                    Everything you need to know about tournaments
                </p>
            </div>

            <div className="space-y-4">
                {sections.map((section, i) => (
                    <motion.div
                        key={section.title}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                    >
                        <Card className="border border-divider">
                            <CardHeader className="gap-2 pb-2">
                                <section.icon className={`h-4 w-4 ${section.color}`} />
                                <h2 className="text-sm font-semibold">{section.title}</h2>
                            </CardHeader>
                            <Divider />
                            <CardBody className="pt-3">
                                <ul className="space-y-2">
                                    {section.rules.map((rule, j) => (
                                        <li
                                            key={j}
                                            className="flex items-start gap-2 text-sm text-foreground/70"
                                        >
                                            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground/20" />
                                            {rule}
                                        </li>
                                    ))}
                                </ul>
                            </CardBody>
                        </Card>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
