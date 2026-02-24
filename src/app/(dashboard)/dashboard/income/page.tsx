"use client";

import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import {
    Card,
    CardBody,
    CardHeader,
    Select,
    SelectItem,
    Skeleton,
} from "@heroui/react";
import {
    DollarSign,
    TrendingUp,
    TrendingDown,
    AlertCircle,
} from "lucide-react";
import { motion } from "motion/react";

interface Income {
    id: string;
    amount: number;
    description: string;
    tournamentName: string | null;
    isSubIncome: boolean;
    createdAt: string;
    children: { id: string; amount: number; description: string }[];
}

interface Deduction {
    category: string;
    total: number;
    count: number;
}

interface IncomeData {
    records: Income[];
    summary: {
        totalOrgIncome: number;
        rpIncome: number;
        rpPurchaseCount: number;
        totalDeductions: number;
        netProfit: number;
        deductions: Deduction[];
    };
}

interface Season {
    id: string;
    name: string;
}

export default function IncomePage() {
    const [selectedSeason, setSelectedSeason] = useState<string>("");

    // Fetch seasons
    const { data: seasons } = useQuery<Season[]>({
        queryKey: ["seasons"],
        queryFn: async () => {
            const res = await fetch("/api/seasons");
            if (!res.ok) throw new Error("Failed");
            const json = await res.json();
            return json.data;
        },
    });

    // Set default to latest season
    useEffect(() => {
        if (seasons && seasons.length > 0 && !selectedSeason) {
            setSelectedSeason(seasons[0].id);
        }
    }, [seasons, selectedSeason]);

    // Fetch income data
    const { data, isLoading, error } = useQuery<IncomeData>({
        queryKey: ["income", selectedSeason],
        queryFn: async () => {
            const res = await fetch(`/api/income?seasonId=${selectedSeason}`);
            if (!res.ok) throw new Error("Failed to fetch");
            const json = await res.json();
            return json.data;
        },
        enabled: !!selectedSeason,
        staleTime: 60 * 1000,
    });

    return (
        <div className="space-y-4 p-4">
            {/* Header + Season Selector */}
            <div className="flex items-center justify-between gap-3">
                <div>
                    <h1 className="text-lg font-bold">Income Tracking</h1>
                    <p className="text-xs text-foreground/40">
                        Revenue & expenses per season
                    </p>
                </div>
                {seasons && seasons.length > 0 && (
                    <Select
                        size="sm"
                        selectedKeys={selectedSeason ? [selectedSeason] : []}
                        onSelectionChange={(keys) => {
                            const val = Array.from(keys)[0] as string;
                            if (val) setSelectedSeason(val);
                        }}
                        className="w-44"
                        aria-label="Select season"
                    >
                        {seasons.map((s) => (
                            <SelectItem key={s.id}>{s.name}</SelectItem>
                        ))}
                    </Select>
                )}
            </div>

            {error && (
                <div className="flex items-center gap-2 rounded-lg bg-danger-50 p-4 text-sm text-danger dark:bg-danger-50/10">
                    <AlertCircle className="h-4 w-4" />
                    Failed to load income data.
                </div>
            )}

            {isLoading ? (
                <div className="space-y-4">
                    <Skeleton className="h-24 w-full rounded-xl" />
                    <Skeleton className="h-48 w-full rounded-xl" />
                </div>
            ) : data ? (
                <>
                    {/* Net Profit/Loss */}
                    <motion.div
                        key={`profit-${selectedSeason}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <Card className="overflow-hidden border border-divider">
                            <CardBody className="items-center gap-1 py-6">
                                {data.summary.netProfit >= 0 ? (
                                    <TrendingUp className="h-6 w-6 text-success" />
                                ) : (
                                    <TrendingDown className="h-6 w-6 text-danger" />
                                )}
                                <span className="text-xs font-medium uppercase tracking-wider text-foreground/50">
                                    {data.summary.netProfit >= 0 ? "Org Profit" : "Org Loss"}
                                </span>
                                <p className={`text-3xl font-bold ${data.summary.netProfit >= 0 ? "text-success" : "text-danger"}`}>
                                    {data.summary.netProfit >= 0 ? "+" : "-"}₹{Math.abs(data.summary.netProfit).toLocaleString()}
                                </p>
                            </CardBody>
                        </Card>
                    </motion.div>

                    {/* Formula Breakdown */}
                    <motion.div
                        key={`breakdown-${selectedSeason}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.05 }}
                    >
                        <Card className="border border-divider">
                            <CardHeader className="pb-2">
                                <h2 className="text-sm font-bold">Breakdown</h2>
                            </CardHeader>
                            <CardBody className="pt-0">
                                <div className="space-y-1.5 text-sm font-mono">
                                    <div className="flex justify-between">
                                        <span className="text-foreground/50">Org Income</span>
                                        <span className="text-success">+₹{data.summary.totalOrgIncome.toLocaleString()}</span>
                                    </div>
                                    {data.summary.rpIncome > 0 && (
                                        <div className="flex justify-between">
                                            <span className="text-foreground/50">RP Purchases <span className="text-foreground/30">({data.summary.rpPurchaseCount})</span></span>
                                            <span className="text-success">+₹{data.summary.rpIncome.toLocaleString()}</span>
                                        </div>
                                    )}
                                    {data.summary.deductions.map((d) => (
                                        <div key={d.category} className="flex justify-between">
                                            <span className="text-foreground/50">{d.category} <span className="text-foreground/30">({d.count})</span></span>
                                            <span className="text-danger">-₹{d.total.toLocaleString()}</span>
                                        </div>
                                    ))}
                                    <div className="border-t border-divider pt-1.5 flex justify-between font-bold">
                                        <span className="text-foreground/70">Net</span>
                                        <span className={data.summary.netProfit >= 0 ? "text-success" : "text-danger"}>
                                            {data.summary.netProfit >= 0 ? "+" : "-"}₹{Math.abs(data.summary.netProfit).toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            </CardBody>
                        </Card>
                    </motion.div>

                    {/* Income Records */}
                    <motion.div
                        key={`records-${selectedSeason}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                    >
                        <Card className="border border-divider">
                            <CardHeader className="pb-2">
                                <h2 className="text-sm font-bold">Income Records</h2>
                                <span className="ml-auto text-xs text-foreground/40">
                                    {data.records.length} entries · ₹{data.records.reduce((s, r) => s + r.amount, 0).toLocaleString()} total
                                </span>
                            </CardHeader>
                            <CardBody className="p-0">
                                <div className="divide-y divide-divider/50">
                                    {data.records.length === 0 ? (
                                        <div className="flex flex-col items-center gap-3 py-12 text-center">
                                            <DollarSign className="h-10 w-10 text-foreground/20" />
                                            <p className="text-sm text-foreground/50">
                                                No income records for this season
                                            </p>
                                        </div>
                                    ) : (
                                        data.records.map((income) => (
                                            <div
                                                key={income.id}
                                                className="flex items-center justify-between px-4 py-3 transition-colors hover:bg-default-100/50"
                                            >
                                                <div>
                                                    <p className="text-sm font-medium">
                                                        {income.description}
                                                    </p>
                                                    {income.tournamentName && (
                                                        <p className="text-xs text-foreground/40">
                                                            {income.tournamentName}
                                                        </p>
                                                    )}
                                                    <p className="text-xs text-foreground/30">
                                                        {new Date(income.createdAt).toLocaleDateString("en-US", {
                                                            month: "short",
                                                            day: "numeric",
                                                            year: "numeric",
                                                        })}
                                                    </p>
                                                </div>
                                                <span className="text-lg font-bold text-success">
                                                    ₹{income.amount.toLocaleString()}
                                                </span>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </CardBody>
                        </Card>
                    </motion.div>
                </>
            ) : null}
        </div>
    );
}
