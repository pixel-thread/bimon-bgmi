"use client";

import { Card, CardBody, CardHeader, Divider, Chip, BookOpen } from "@heroui/react";
import {
    BookOpen as BookOpenIcon,
    CheckCircle,
    AlertCircle,
    Shield,
    Trophy,
    Coins,
    Zap,
    Users,
    Ban,
    FileText,
} from "lucide-react";
import { motion } from "motion/react";

/**
 * /dashboard/rules — Admin rules board.
 * Shows official rules categorized, same content as the public rules page
 * but in the admin layout.
 */

const rulesSections = [
    {
        title: "Tournament Rules",
        icon: Trophy,
        color: "text-primary",
        rules: [
            "All players must register before tournament start",
            "Teams are generated via polls — IN/OUT/SOLO votes",
            "No late entries after team generation",
            "Admin's decision on disputes is final",
            "AFK players may be replaced or penalized",
        ],
    },
    {
        title: "Scoring System",
        icon: Zap,
        color: "text-success",
        rules: [
            "Kills and deaths are tracked per match per player",
            "Team placement determines position points",
            "Stats contribute to player tier (LEGEND→BOT)",
            "Seasonal stats reset each season",
        ],
    },
    {
        title: "Economy (UC)",
        icon: Coins,
        color: "text-warning",
        rules: [
            "Prize pool = Entry × Players - Organizer Fee (10%)",
            "Fund contribution: 4% of prize pool",
            "Winner distribution: 1st > 2nd > 3rd proportional split",
            "Solo tax applies to SOLO vote players",
            "UC wallet tracks all credit/debit transactions",
        ],
    },
    {
        title: "Streaks & Rewards",
        icon: Zap,
        color: "text-secondary",
        rules: [
            "IN vote + tournament participation = streak +1",
            "Missing a tournament resets streak to 0",
            "Royal Pass holders get rewards at streak 8",
            "Merit system rewards consistent players",
        ],
    },
    {
        title: "Fair Play",
        icon: Shield,
        color: "text-primary",
        rules: [
            "No cheating, hacking, or exploiting glitches",
            "No abusive language toward other players",
            "Report issues to admins, not in public chat",
            "Screen recording encouraged for disputes",
        ],
    },
    {
        title: "Bans & Penalties",
        icon: Ban,
        color: "text-danger",
        rules: [
            "Cheating = permanent ban",
            "AFK in 2+ matches = temporary ban",
            "Repeated toxic behavior = escalating penalties",
            "Banned players' UC is frozen, not forfeited",
        ],
    },
    {
        title: "Teams",
        icon: Users,
        color: "text-foreground/60",
        rules: [
            "Team sizes: Duos, Trios, or Quads based on poll type",
            "Teams are balanced by player category/tier",
            "Back-to-back teammate prevention is enforced",
            "Team numbers are assigned randomly",
        ],
    },
];

export default function AdminRulesPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-xl font-bold">Rules</h1>
                <p className="text-sm text-foreground/50">
                    Official tournament rules and guidelines
                </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
                {rulesSections.map((section, i) => {
                    const Icon = section.icon;
                    return (
                        <motion.div
                            key={section.title}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.03 }}
                        >
                            <Card className="border border-divider h-full">
                                <CardHeader className="gap-2 pb-1">
                                    <Icon className={`h-4 w-4 ${section.color}`} />
                                    <h3 className="text-sm font-semibold">{section.title}</h3>
                                </CardHeader>
                                <Divider />
                                <CardBody className="pt-2">
                                    <ul className="space-y-1.5">
                                        {section.rules.map((rule, j) => (
                                            <li
                                                key={j}
                                                className="flex items-start gap-2 text-xs text-foreground/60"
                                            >
                                                <CheckCircle className="mt-0.5 h-3 w-3 shrink-0 text-success/50" />
                                                {rule}
                                            </li>
                                        ))}
                                    </ul>
                                </CardBody>
                            </Card>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}
