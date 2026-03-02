"use client";

import { useQuery } from "@tanstack/react-query";
import {
    Card,
    CardBody,
    Chip,
    Skeleton,
    Avatar,
    Input,
    Progress,
} from "@heroui/react";
import {
    Search,
    Users,
    Banknote,
    Clock,
    CheckCircle,
    TrendingUp,
    ChevronDown,
} from "lucide-react";
import { motion } from "motion/react";
import { useState, useMemo } from "react";

interface Promoter {
    id: string;
    username: string;
    imageUrl: string | null;
    totalEarnings: number;
}

interface Referred {
    id: string;
    name: string;
    username: string;
    imageUrl: string | null;
}

interface ReferralItem {
    id: string;
    promoter: Promoter;
    referred: Referred;
    tournamentsCompleted: number;
    tournamentsRequired: number;
    progress: number;
    status: "PENDING" | "QUALIFIED" | "PAID";
    reward: number;
    qualifiedAt: string | null;
    paidAt: string | null;
    createdAt: string;
}

interface ReferralStats {
    total: number;
    pending: number;
    qualified: number;
    paid: number;
    totalUCPaid: number;
    rewardPerReferral: number;
    tournamentsRequired: number;
}

interface ReferralData {
    referrals: ReferralItem[];
    stats: ReferralStats;
    topPromoters: unknown[];
}

interface PromoterGroup {
    promoter: Promoter;
    referrals: ReferralItem[];
    paidCount: number;
    totalEarned: number;
}

const statusConfig = {
    PENDING: { color: "warning" as const, icon: Clock, label: "In Progress" },
    QUALIFIED: { color: "primary" as const, icon: CheckCircle, label: "Qualified" },
    PAID: { color: "success" as const, icon: Banknote, label: "Paid" },
};

export default function ReferralAdminPage() {
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<"ALL" | "PENDING" | "QUALIFIED" | "PAID">("ALL");
    const [expandedPromoters, setExpandedPromoters] = useState<Set<string>>(new Set());

    const { data, isLoading, error } = useQuery<ReferralData>({
        queryKey: ["admin-referrals"],
        queryFn: async () => {
            const res = await fetch("/api/dashboard/referrals");
            if (!res.ok) throw new Error("Failed");
            const json = await res.json();
            return json.data;
        },
        staleTime: 30 * 1000,
    });

    const groups = useMemo((): PromoterGroup[] => {
        if (!data) return [];
        let list = data.referrals;

        if (statusFilter !== "ALL") {
            list = list.filter((r) => r.status === statusFilter);
        }
        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter(
                (r) =>
                    r.promoter.username.toLowerCase().includes(q) ||
                    r.referred.name.toLowerCase().includes(q) ||
                    r.referred.username.toLowerCase().includes(q)
            );
        }

        // Group by promoter
        const map = new Map<string, PromoterGroup>();
        for (const ref of list) {
            const existing = map.get(ref.promoter.id);
            if (existing) {
                existing.referrals.push(ref);
                if (ref.status === "PAID") {
                    existing.paidCount++;
                    existing.totalEarned += ref.reward;
                }
            } else {
                map.set(ref.promoter.id, {
                    promoter: ref.promoter,
                    referrals: [ref],
                    paidCount: ref.status === "PAID" ? 1 : 0,
                    totalEarned: ref.status === "PAID" ? ref.reward : 0,
                });
            }
        }

        // Sort by most referrals first
        return Array.from(map.values()).sort((a, b) => b.referrals.length - a.referrals.length);
    }, [data, search, statusFilter]);

    const togglePromoter = (id: string) => {
        setExpandedPromoters((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    if (error) {
        return (
            <div className="flex items-center justify-center py-20">
                <p className="text-danger">Failed to load referrals</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold">Referrals</h2>
                <p className="text-sm text-foreground/50">Track all referral activity and promoter performance</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {isLoading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                        <Card key={i}><CardBody className="p-4"><Skeleton className="h-16 rounded-lg" /></CardBody></Card>
                    ))
                ) : data ? (
                    <>
                        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                            <Card>
                                <CardBody className="p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10">
                                            <Users className="h-5 w-5 text-blue-500" />
                                        </div>
                                        <div>
                                            <p className="text-2xl font-bold">{data.stats.total}</p>
                                            <p className="text-xs text-foreground/50">Total Referrals</p>
                                        </div>
                                    </div>
                                </CardBody>
                            </Card>
                        </motion.div>
                        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
                            <Card>
                                <CardBody className="p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10">
                                            <Clock className="h-5 w-5 text-amber-500" />
                                        </div>
                                        <div>
                                            <p className="text-2xl font-bold">{data.stats.pending}</p>
                                            <p className="text-xs text-foreground/50">In Progress</p>
                                        </div>
                                    </div>
                                </CardBody>
                            </Card>
                        </motion.div>
                        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                            <Card>
                                <CardBody className="p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-500/10">
                                            <CheckCircle className="h-5 w-5 text-green-500" />
                                        </div>
                                        <div>
                                            <p className="text-2xl font-bold">{data.stats.paid}</p>
                                            <p className="text-xs text-foreground/50">Paid Out</p>
                                        </div>
                                    </div>
                                </CardBody>
                            </Card>
                        </motion.div>
                        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                            <Card>
                                <CardBody className="p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10">
                                            <Banknote className="h-5 w-5 text-purple-500" />
                                        </div>
                                        <div>
                                            <p className="text-2xl font-bold">{data.stats.totalUCPaid} UC</p>
                                            <p className="text-xs text-foreground/50">Total Paid</p>
                                        </div>
                                    </div>
                                </CardBody>
                            </Card>
                        </motion.div>
                    </>
                ) : null}
            </div>

            {/* Filters */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <Input
                    placeholder="Search promoter or player..."
                    startContent={<Search className="h-4 w-4 text-foreground/40" />}
                    value={search}
                    onValueChange={setSearch}
                    size="sm"
                    className="sm:max-w-xs"
                />
                <div className="flex gap-2 flex-wrap">
                    {(["ALL", "PENDING", "QUALIFIED", "PAID"] as const).map((s) => (
                        <Chip
                            key={s}
                            variant={statusFilter === s ? "solid" : "flat"}
                            color={s === "ALL" ? "default" : statusConfig[s].color}
                            className="cursor-pointer"
                            onClick={() => setStatusFilter(s)}
                        >
                            {s === "ALL" ? "All" : statusConfig[s].label}
                            {data && (
                                <span className="ml-1 opacity-60">
                                    {s === "ALL" ? data.stats.total : s === "PENDING" ? data.stats.pending : s === "QUALIFIED" ? data.stats.qualified : data.stats.paid}
                                </span>
                            )}
                        </Chip>
                    ))}
                </div>
            </div>

            {/* Grouped Referral List */}
            <div className="space-y-2">
                {isLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                        <Card key={i}><CardBody className="p-4"><Skeleton className="h-16 rounded-lg" /></CardBody></Card>
                    ))
                ) : groups.length === 0 ? (
                    <Card>
                        <CardBody className="py-12 text-center">
                            <Users className="mx-auto mb-2 h-8 w-8 text-foreground/20" />
                            <p className="text-sm text-foreground/50">No referrals found</p>
                        </CardBody>
                    </Card>
                ) : (
                    groups.map((group, gi) => {
                        const isExpanded = expandedPromoters.has(group.promoter.id);
                        return (
                            <motion.div
                                key={group.promoter.id}
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: gi * 0.03 }}
                            >
                                <Card>
                                    {/* Promoter Header — clickable to expand */}
                                    <CardBody className="p-0">
                                        <button
                                            onClick={() => togglePromoter(group.promoter.id)}
                                            className="flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-default-100/50"
                                        >
                                            <Avatar
                                                src={group.promoter.imageUrl || undefined}
                                                name={group.promoter.username}
                                                size="sm"
                                                className="shrink-0"
                                            />
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm font-semibold truncate">{group.promoter.username}</p>
                                                <div className="flex items-center gap-2 text-[11px] text-foreground/50">
                                                    <span>{group.referrals.length} referred</span>
                                                    <span>·</span>
                                                    <span>{group.paidCount} paid</span>
                                                    {group.totalEarned > 0 && (
                                                        <>
                                                            <span>·</span>
                                                            <span className="text-green-500 font-medium">{group.totalEarned} UC</span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                            <ChevronDown
                                                className={`h-4 w-4 text-foreground/30 shrink-0 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                                            />
                                        </button>

                                        {/* Expanded referral list */}
                                        <div
                                            className={`overflow-hidden transition-all duration-200 ${isExpanded ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"}`}
                                        >
                                            <div className="border-t border-divider divide-y divide-divider">
                                                {group.referrals.map((ref) => {
                                                    const config = statusConfig[ref.status];
                                                    const StatusIcon = config.icon;
                                                    return (
                                                        <div key={ref.id} className="flex items-center gap-3 px-4 py-3 pl-14">
                                                            <div className="min-w-0 flex-1">
                                                                <div className="flex items-center gap-1.5">
                                                                    <TrendingUp className="h-3 w-3 text-foreground/30 shrink-0" />
                                                                    <p className="text-sm truncate">{ref.referred.name}</p>
                                                                    <span className="text-[11px] text-foreground/40 shrink-0">@{ref.referred.username}</span>
                                                                </div>
                                                                <div className="flex items-center gap-2 mt-1">
                                                                    <Progress
                                                                        value={ref.progress}
                                                                        size="sm"
                                                                        color={ref.status === "PAID" ? "success" : ref.status === "QUALIFIED" ? "primary" : "warning"}
                                                                        className="max-w-[80px]"
                                                                    />
                                                                    <span className="text-[10px] text-foreground/40 shrink-0">
                                                                        {ref.tournamentsCompleted}/{ref.tournamentsRequired}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-2 shrink-0">
                                                                <Chip
                                                                    size="sm"
                                                                    variant="flat"
                                                                    color={config.color}
                                                                    startContent={<StatusIcon className="h-3 w-3" />}
                                                                >
                                                                    {config.label}
                                                                </Chip>
                                                                {ref.status === "PAID" && (
                                                                    <span className="text-xs font-semibold text-green-500">{ref.reward} UC</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </CardBody>
                                </Card>
                            </motion.div>
                        );
                    })
                )}
            </div>

            {/* Info */}
            {data && (
                <p className="text-center text-xs text-foreground/30">
                    {data.stats.rewardPerReferral} UC per referral · {data.stats.tournamentsRequired} tournaments required
                </p>
            )}
        </div>
    );
}
