"use client";

import { useQuery } from "@tanstack/react-query";
import {
    Card,
    CardBody,
    CardHeader,
    Divider,
    Skeleton,
} from "@heroui/react";
import {
    DollarSign,
    TrendingUp,
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

/**
 * /dashboard/income — Income tracking for admins.
 */
export default function IncomePage() {
    const { data, isLoading, error } = useQuery<Income[]>({
        queryKey: ["income"],
        queryFn: async () => {
            const res = await fetch("/api/income");
            if (!res.ok) throw new Error("Failed to fetch");
            const json = await res.json();
            return json.data;
        },
        staleTime: 60 * 1000,
    });

    const totalIncome = data?.reduce((sum, i) => sum + i.amount, 0) ?? 0;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-xl font-bold">Income Tracking</h1>
                <p className="text-sm text-foreground/50">
                    Revenue from tournaments and fees
                </p>
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
                    <Skeleton className="h-16 w-full rounded-xl" />
                    <Skeleton className="h-16 w-full rounded-xl" />
                </div>
            ) : (
                <>
                    {/* Total summary */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <Card className="overflow-hidden border border-divider bg-gradient-to-br from-success/10 to-success/5">
                            <CardBody className="items-center gap-1 py-6">
                                <DollarSign className="h-6 w-6 text-success" />
                                <span className="text-xs font-medium uppercase tracking-wider text-foreground/50">
                                    Total Income
                                </span>
                                <p className="text-3xl font-bold">
                                    ₹{totalIncome.toLocaleString()}
                                </p>
                            </CardBody>
                        </Card>
                    </motion.div>

                    {/* Income entries */}
                    <div className="space-y-2">
                        {(!data || data.length === 0) ? (
                            <div className="flex flex-col items-center gap-3 rounded-xl bg-default-100 py-12 text-center">
                                <TrendingUp className="h-10 w-10 text-foreground/20" />
                                <p className="text-sm text-foreground/50">
                                    No income records yet
                                </p>
                            </div>
                        ) : (
                            data.map((income, i) => (
                                <motion.div
                                    key={income.id}
                                    initial={{ opacity: 0, y: 6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.02 }}
                                >
                                    <Card className="border border-divider">
                                        <CardBody className="p-4">
                                            <div className="flex items-center justify-between">
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
                                                        {new Date(income.createdAt).toLocaleDateString()}
                                                    </p>
                                                </div>
                                                <span className="text-lg font-bold text-success">
                                                    ₹{income.amount.toLocaleString()}
                                                </span>
                                            </div>

                                            {/* Sub-income breakdown */}
                                            {income.children.length > 0 && (
                                                <div className="mt-3 space-y-1 border-t border-divider pt-2">
                                                    {income.children.map((child) => (
                                                        <div
                                                            key={child.id}
                                                            className="flex items-center justify-between text-xs text-foreground/50"
                                                        >
                                                            <span>{child.description}</span>
                                                            <span className="font-medium">
                                                                ₹{child.amount.toLocaleString()}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </CardBody>
                                    </Card>
                                </motion.div>
                            ))
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
