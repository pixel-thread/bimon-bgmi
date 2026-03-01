"use client";

import { useQuery } from "@tanstack/react-query";
import {
    Card,
    CardBody,
    CardHeader,
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
    Trophy,
    TrendingUp,
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

interface TopPromoter {
    id: string;
    username: string;
    imageUrl: string | null;
    count: number;
    paid: number;
    earnings: number;
}

interface ReferralData {
    referrals: ReferralItem[];
    stats: ReferralStats;
    topPromoters: TopPromoter[];
}

const statusConfig = {
    PENDING: { color: "warning" as const, icon: Clock, label: "In Progress" },
    QUALIFIED: { color: "primary" as const, icon: CheckCircle, label: "Qualified" },
    PAID: { color: "success" as const, icon: Banknote, label: "Paid" },
};

export default function ReferralAdminPage() {
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<"ALL" | "PENDING" | "QUALIFIED" | "PAID">("ALL");

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

    const filtered = useMemo(() => {
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
        return list;
    }, [data, search, statusFilter]);

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

            {/* Top Promoters */}
            {data && data.topPromoters.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                    <Card>
                        <CardHeader className="px-4 pt-4 pb-2">
                            <div className="flex items-center gap-2">
                                <Trophy className="h-4 w-4 text-amber-500" />
                                <h3 className="text-sm font-semibold">Top Promoters</h3>
                            </div>
                        </CardHeader>
                        <CardBody className="px-4 pb-4 pt-0">
                            <div className="flex gap-3 overflow-x-auto pb-1">
                                {data.topPromoters.map((p, i) => (
                                    <div key={p.id} className="flex shrink-0 items-center gap-2 rounded-xl border border-divider p-3 min-w-[160px]">
                                        <div className="relative">
                                            <Avatar src={p.imageUrl || undefined} name={p.username} size="sm" />
                                            {i < 3 && (
                                                <div className={`absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full text-[8px] font-bold text-white ${i === 0 ? "bg-amber-500" : i === 1 ? "bg-gray-400" : "bg-amber-700"}`}>
                                                    {i + 1}
                                                </div>
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium truncate">{p.username}</p>
                                            <p className="text-xs text-foreground/50">{p.count} referred · {p.paid} paid</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardBody>
                    </Card>
                </motion.div>
            )}

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

            {/* Referral List */}
            <div className="space-y-2">
                {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                        <Card key={i}><CardBody className="p-4"><Skeleton className="h-16 rounded-lg" /></CardBody></Card>
                    ))
                ) : filtered.length === 0 ? (
                    <Card>
                        <CardBody className="py-12 text-center">
                            <Users className="mx-auto mb-2 h-8 w-8 text-foreground/20" />
                            <p className="text-sm text-foreground/50">No referrals found</p>
                        </CardBody>
                    </Card>
                ) : (
                    filtered.map((ref, i) => {
                        const config = statusConfig[ref.status];
                        const StatusIcon = config.icon;
                        return (
                            <motion.div
                                key={ref.id}
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.02 }}
                            >
                                <Card>
                                    <CardBody className="p-4">
                                        <div className="flex items-center gap-3">
                                            {/* Promoter → Referred */}
                                            <div className="flex items-center gap-2 min-w-0 flex-1">
                                                <Avatar
                                                    src={ref.promoter.imageUrl || undefined}
                                                    name={ref.promoter.username}
                                                    size="sm"
                                                    className="shrink-0"
                                                />
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-1.5">
                                                        <p className="text-sm font-medium truncate">{ref.promoter.username}</p>
                                                        <TrendingUp className="h-3 w-3 text-foreground/30 shrink-0" />
                                                        <p className="text-sm truncate text-foreground/70">{ref.referred.name}</p>
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <Progress
                                                            value={ref.progress}
                                                            size="sm"
                                                            color={ref.status === "PAID" ? "success" : ref.status === "QUALIFIED" ? "primary" : "warning"}
                                                            className="max-w-[100px]"
                                                        />
                                                        <span className="text-[10px] text-foreground/40 shrink-0">
                                                            {ref.tournamentsCompleted}/{ref.tournamentsRequired}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Status + Reward */}
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
