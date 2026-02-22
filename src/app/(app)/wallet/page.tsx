"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import {
    Card,
    CardBody,
    CardHeader,
    Divider,
    Skeleton,
    Button,
} from "@heroui/react";
import {
    Wallet as WalletIcon,
    ArrowUpRight,
    ArrowDownLeft,
    Clock,
    AlertCircle,
    ChevronsDown,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";

interface TransactionDTO {
    id: string;
    amount: number;
    type: "CREDIT" | "DEBIT";
    description: string;
    createdAt: string;
}

interface TransactionsResponse {
    data: TransactionDTO[];
    meta: { hasMore: boolean; nextCursor: string | null };
}

interface WalletData {
    balance: number;
}

/**
 * /wallet — Full wallet page with balance + transaction history.
 */
export default function WalletPage() {
    // Balance
    const { data: wallet, isLoading: isLoadingWallet } = useQuery<WalletData>({
        queryKey: ["wallet"],
        queryFn: async () => {
            const res = await fetch("/api/profile");
            if (!res.ok) throw new Error("Failed to fetch");
            const json = await res.json();
            return { balance: json.data?.player?.wallet?.balance ?? 0 };
        },
        staleTime: 30 * 1000,
    });

    // Transactions
    const {
        data: txData,
        isLoading: isLoadingTx,
        error,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
    } = useInfiniteQuery<TransactionsResponse>({
        queryKey: ["transactions"],
        queryFn: async ({ pageParam }) => {
            const params = new URLSearchParams({
                limit: "30",
                ...(pageParam ? { cursor: pageParam as string } : {}),
            });
            const res = await fetch(`/api/transactions?${params}`);
            if (!res.ok) throw new Error("Failed to fetch");
            return res.json();
        },
        initialPageParam: null as string | null,
        getNextPageParam: (last) =>
            last.meta.hasMore ? last.meta.nextCursor : undefined,
        staleTime: 60 * 1000,
    });

    const transactions = txData?.pages.flatMap((p) => p.data) ?? [];

    return (
        <div className="mx-auto max-w-lg px-4 py-6 sm:px-6">
            <div className="mb-6 space-y-1">
                <div className="flex items-center gap-2">
                    <WalletIcon className="h-5 w-5 text-primary" />
                    <h1 className="text-lg font-bold">Wallet</h1>
                </div>
                <p className="text-sm text-foreground/50">
                    Your UC balance and transactions
                </p>
            </div>

            <div className="space-y-4">
                {/* Balance card */}
                {isLoadingWallet ? (
                    <Skeleton className="h-32 w-full rounded-xl" />
                ) : (
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <Card className="overflow-hidden border border-divider bg-gradient-to-br from-primary/10 to-primary/5">
                            <CardBody className="items-center gap-1 py-8">
                                <span className="text-xs font-medium uppercase tracking-wider text-foreground/50">
                                    Available Balance
                                </span>
                                <p
                                    className={`text-4xl font-bold ${(wallet?.balance ?? 0) < 0
                                        ? "text-danger"
                                        : "text-foreground"
                                        }`}
                                >
                                    {(wallet?.balance ?? 0).toLocaleString()} UC
                                </p>
                            </CardBody>
                        </Card>
                    </motion.div>
                )}

                {/* Transaction history */}
                <Card className="border border-divider">
                    <CardHeader className="pb-2">
                        <h3 className="text-sm font-semibold">Transaction History</h3>
                    </CardHeader>
                    <Divider />
                    <CardBody className="p-0">
                        {error && (
                            <div className="flex items-center gap-2 p-4 text-sm text-danger">
                                <AlertCircle className="h-4 w-4" />
                                Failed to load transactions.
                            </div>
                        )}

                        {isLoadingTx && (
                            <div className="space-y-0 p-4">
                                {[1, 2, 3, 4, 5].map((i) => (
                                    <div
                                        key={i}
                                        className="flex items-center gap-3 py-3"
                                    >
                                        <Skeleton className="h-8 w-8 rounded-full" />
                                        <div className="flex-1 space-y-1.5">
                                            <Skeleton className="h-3 w-32 rounded" />
                                            <Skeleton className="h-2 w-20 rounded" />
                                        </div>
                                        <Skeleton className="h-4 w-14 rounded" />
                                    </div>
                                ))}
                            </div>
                        )}

                        {!isLoadingTx && transactions.length === 0 && !error && (
                            <div className="flex flex-col items-center gap-3 py-8 text-center">
                                <Clock className="h-8 w-8 text-foreground/20" />
                                <p className="text-sm text-foreground/40">
                                    No transactions yet
                                </p>
                            </div>
                        )}

                        {transactions.length > 0 && (
                            <div className="divide-y divide-divider">
                                {transactions.map((tx) => (
                                    <div
                                        key={tx.id}
                                        className="flex items-center gap-3 px-4 py-3"
                                    >
                                        <div
                                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${tx.type === "CREDIT"
                                                ? "bg-success/10"
                                                : "bg-danger/10"
                                                }`}
                                        >
                                            {tx.type === "CREDIT" ? (
                                                <ArrowDownLeft className="h-4 w-4 text-success" />
                                            ) : (
                                                <ArrowUpRight className="h-4 w-4 text-danger" />
                                            )}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm">
                                                {tx.description}
                                            </p>
                                            <p className="text-xs text-foreground/40">
                                                {new Date(tx.createdAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <span
                                            className={`shrink-0 text-sm font-semibold ${tx.type === "CREDIT"
                                                ? "text-success"
                                                : "text-danger"
                                                }`}
                                        >
                                            {tx.type === "CREDIT" ? "+" : "-"}
                                            {tx.amount.toLocaleString()} UC
                                        </span>
                                    </div>
                                ))}

                                {hasNextPage && (
                                    <div className="flex justify-center py-3">
                                        <Button
                                            size="sm"
                                            variant="light"
                                            isLoading={isFetchingNextPage}
                                            onPress={() => fetchNextPage()}
                                            startContent={
                                                !isFetchingNextPage && (
                                                    <ChevronsDown className="h-4 w-4" />
                                                )
                                            }
                                        >
                                            Load More
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )}
                    </CardBody>
                </Card>
            </div>
        </div>
    );
}
