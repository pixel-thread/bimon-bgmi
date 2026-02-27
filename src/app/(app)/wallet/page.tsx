"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import {
    useInfiniteQuery,
    useQuery,
    useMutation,
    useQueryClient,
} from "@tanstack/react-query";
import {
    Card,
    CardBody,
    CardHeader,
    Divider,
    Skeleton,
    Button,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    useDisclosure,
} from "@heroui/react";
import {
    Wallet as WalletIcon,
    ArrowUpRight,
    ArrowDownLeft,
    Clock,
    AlertCircle,
    Loader2,
    Plus,
    CreditCard,
    IndianRupee,
    Sparkles,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";

// ─── Razorpay Types ─────────────────────────────────────────

declare global {
    interface Window {
        Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
    }
}

interface RazorpayOptions {
    key: string;
    amount: number;
    currency: string;
    name: string;
    description: string;
    order_id: string;
    handler: (response: RazorpayResponse) => void;
    prefill?: { name?: string; email?: string };
    theme?: { color?: string };
    modal?: { ondismiss?: () => void };
}

interface RazorpayInstance {
    open: () => void;
    close: () => void;
}

interface RazorpayResponse {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
}

interface CreateOrderResponse {
    orderId: string;
    amount: number;
    currency: string;
    keyId: string;
}

// ─── Data Types ─────────────────────────────────────────────

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

// ─── Constants ──────────────────────────────────────────────

const PLATFORM_FEE_PERCENT = 2.4;
const QUICK_UC_AMOUNTS = [10, 50, 100, 200];

/** Calculate rupee amount to charge for desired UC (includes 2.4% Razorpay fee) */
const calculateRupees = (uc: number) => {
    const exactAmount = uc / (1 - PLATFORM_FEE_PERCENT / 100);
    return Math.round(exactAmount * 100) / 100;
};

const formatRupees = (amount: number) =>
    amount % 1 === 0 ? amount.toString() : amount.toFixed(2);

/** Load Razorpay checkout script */
const loadRazorpayScript = (): Promise<boolean> =>
    new Promise((resolve) => {
        if (window.Razorpay) {
            resolve(true);
            return;
        }
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });

// ─── Component ──────────────────────────────────────────────

export default function WalletPage() {
    const loadMoreRef = useRef<HTMLDivElement>(null);
    const queryClient = useQueryClient();
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [desiredUC, setDesiredUC] = useState<number>(50);

    const rupeeAmount = calculateRupees(desiredUC);
    const isValidAmount = desiredUC >= 10 && rupeeAmount <= 10000;

    // ── Balance ─────────────────────────────────────────────
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

    // ── Current season ──────────────────────────────────────
    const { data: currentSeasonId } = useQuery<string | null>({
        queryKey: ["current-season"],
        queryFn: async () => {
            const res = await fetch("/api/seasons");
            if (!res.ok) return null;
            const json = await res.json();
            const current = (json.data ?? []).find(
                (s: { isCurrent: boolean }) => s.isCurrent
            );
            return current?.id ?? null;
        },
        staleTime: 5 * 60 * 1000,
    });

    // ── Transactions (infinite scroll) ──────────────────────
    const {
        data: txData,
        isLoading: isLoadingTx,
        error,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
    } = useInfiniteQuery<TransactionsResponse>({
        queryKey: ["transactions", currentSeasonId],
        queryFn: async ({ pageParam }) => {
            const params = new URLSearchParams({
                limit: "10",
                ...(pageParam ? { cursor: pageParam as string } : {}),
                ...(currentSeasonId ? { seasonId: currentSeasonId } : {}),
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

    // ── Razorpay: Create Order ──────────────────────────────
    const createOrder = useMutation({
        mutationFn: async () => {
            const res = await fetch("/api/payments/create-order", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    amount: rupeeAmount,
                    amountInPaise: Math.round(rupeeAmount * 100),
                }),
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || "Failed to create order");
            }
            const json = await res.json();
            return json.data as CreateOrderResponse;
        },
        onSuccess: async (data) => {
            const { orderId, amount: orderAmount, currency, keyId } = data;

            const scriptLoaded = await loadRazorpayScript();
            if (!scriptLoaded) {
                toast.error("Failed to load payment gateway");
                return;
            }

            const options: RazorpayOptions = {
                key: keyId,
                amount: orderAmount,
                currency,
                name: "PUBGMI",
                description: `Add ${desiredUC} UC to your balance`,
                order_id: orderId,
                handler: (response: RazorpayResponse) => {
                    verifyPayment.mutate(response);
                },
                theme: { color: "#6366f1" },
                modal: {
                    ondismiss: () => toast.info("Payment cancelled"),
                },
            };

            const rzp = new window.Razorpay(options);
            rzp.open();
        },
        onError: (err: Error) => {
            toast.error(err.message || "Failed to initiate payment");
        },
    });

    // ── Razorpay: Verify Payment ────────────────────────────
    const verifyPayment = useMutation({
        mutationFn: async (paymentResponse: RazorpayResponse) => {
            const res = await fetch("/api/payments/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(paymentResponse),
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(
                    data.message || "Payment verification failed"
                );
            }
            return res.json();
        },
        onSuccess: (data) => {
            const ucAdded = data?.data?.ucAdded ?? 0;
            toast.success(`🎉 Added ${ucAdded} UC! 7x chance for free tournament entry 🎯`);
            queryClient.invalidateQueries({ queryKey: ["wallet"] });
            queryClient.invalidateQueries({ queryKey: ["profile"] });
            queryClient.invalidateQueries({ queryKey: ["transactions"] });
            onClose();
            setDesiredUC(50);
        },
        onError: (err: Error) => {
            toast.error(
                err.message ||
                "Payment verification failed. Please contact support."
            );
        },
    });

    const isPaymentLoading = createOrder.isPending || verifyPayment.isPending;

    // ── IntersectionObserver for infinite scroll ─────────────
    const handleIntersection = useCallback(
        (entries: IntersectionObserverEntry[]) => {
            if (
                entries[0].isIntersecting &&
                hasNextPage &&
                !isFetchingNextPage
            ) {
                fetchNextPage();
            }
        },
        [hasNextPage, isFetchingNextPage, fetchNextPage]
    );

    useEffect(() => {
        if (!loadMoreRef.current) return;
        const observer = new IntersectionObserver(handleIntersection, {
            threshold: 0.1,
        });
        observer.observe(loadMoreRef.current);
        return () => observer.disconnect();
    }, [handleIntersection]);

    // Check if player has topped up via Razorpay
    const hasRazorpayTopUp = transactions.some((t) =>
        t.description.toLowerCase().includes("razorpay")
    );


    return (
        <div className="mx-auto max-w-lg px-4 py-6 sm:px-6">
            {/* Header */}
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
                {/* ── Balance Card ────────────────────────────── */}
                {isLoadingWallet ? (
                    <Skeleton className="h-44 w-full rounded-2xl" />
                ) : (
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <Card className="overflow-hidden border-none bg-gradient-to-br from-primary/20 via-primary/10 to-secondary/10">
                            {/* Decorative elements */}
                            <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-primary/10 blur-2xl" />
                            <div className="pointer-events-none absolute -left-4 bottom-0 h-24 w-24 rounded-full bg-secondary/10 blur-xl" />

                            <CardBody className="relative z-10 gap-4 p-6">
                                <div className="flex items-start justify-between">
                                    <div className="space-y-1">
                                        <span className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-foreground/50">
                                            <Sparkles className="h-3 w-3" />
                                            Available Balance
                                        </span>
                                        <p
                                            className={`whitespace-nowrap text-4xl font-bold tracking-tight ${(wallet?.balance ?? 0) < 0
                                                ? "text-danger"
                                                : "text-foreground"
                                                }`}
                                        >
                                            {(
                                                wallet?.balance ?? 0
                                            ).toLocaleString()}{" "}
                                            <span className="text-lg font-semibold text-foreground/40">
                                                UC
                                            </span>
                                        </p>
                                    </div>
                                    <Button
                                        size="sm"
                                        color="primary"
                                        className="font-semibold"
                                        startContent={
                                            <Plus className="h-4 w-4" />
                                        }
                                        onPress={onOpen}
                                    >
                                        Add UC
                                    </Button>
                                </div>

                                {/* Lucky voter promo */}
                                <div className="flex items-center gap-2 rounded-lg bg-success/10 px-3 py-2">
                                    <span className="text-xs">{hasRazorpayTopUp ? "🎉" : "🎯"}</span>
                                    <p className="text-[11px] font-medium text-success">
                                        {hasRazorpayTopUp
                                            ? "You have 7x chance for free tournament entry this season!"
                                            : "Add UC = 7x chance for free tournament entry"}
                                    </p>
                                </div>
                            </CardBody>
                        </Card>
                    </motion.div>
                )}

                {/* ── Transaction History ─────────────────────── */}
                <Card className="border border-divider">
                    <CardHeader className="flex items-center justify-between pb-2">
                        <h3 className="text-sm font-semibold">
                            Transaction History
                        </h3>
                        {transactions.length > 0 && (
                            <span className="text-[10px] text-foreground/30">
                                This season
                            </span>
                        )}
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
                                        <Skeleton className="h-9 w-9 rounded-full" />
                                        <div className="flex-1 space-y-1.5">
                                            <Skeleton className="h-3 w-32 rounded" />
                                            <Skeleton className="h-2 w-20 rounded" />
                                        </div>
                                        <Skeleton className="h-4 w-14 rounded" />
                                    </div>
                                ))}
                            </div>
                        )}

                        {!isLoadingTx &&
                            transactions.length === 0 &&
                            !error && (
                                <div className="flex flex-col items-center gap-3 py-8 text-center">
                                    <Clock className="h-8 w-8 text-foreground/20" />
                                    <p className="text-sm text-foreground/40">
                                        No transactions yet
                                    </p>
                                </div>
                            )}

                        {transactions.length > 0 && (
                            <div className="divide-y divide-divider">
                                {transactions.map((tx, i) => {
                                    // Compute balance after this tx by working backwards
                                    // from current balance through all prior transactions
                                    const laterTxs = transactions.slice(0, i);
                                    let balAfter = wallet?.balance ?? 0;
                                    for (const lt of laterTxs) {
                                        balAfter -= lt.type === "CREDIT" ? lt.amount : -lt.amount;
                                    }
                                    const balBefore = tx.type === "CREDIT"
                                        ? balAfter - tx.amount
                                        : balAfter + tx.amount;

                                    return (
                                        <motion.div
                                            key={tx.id}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: i * 0.02 }}
                                            className="flex items-center gap-3 px-4 py-3"
                                        >
                                            <div
                                                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${tx.type === "CREDIT"
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
                                                <p className="text-xs">
                                                    {tx.description}
                                                </p>
                                                <div className="flex items-center gap-1.5 text-[10px] text-foreground/40">
                                                    <span>
                                                        {new Date(
                                                            tx.createdAt
                                                        ).toLocaleDateString("en-IN", {
                                                            day: "numeric",
                                                            month: "short",
                                                        })}
                                                    </span>
                                                    <span>·</span>
                                                    <span>
                                                        {balBefore.toLocaleString()} → {balAfter.toLocaleString()} UC
                                                    </span>
                                                </div>
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
                                        </motion.div>
                                    );
                                })}

                                {/* Infinite scroll trigger */}
                                <div
                                    ref={loadMoreRef}
                                    className="flex justify-center py-3"
                                >
                                    {isFetchingNextPage && (
                                        <Loader2 className="h-4 w-4 animate-spin text-foreground/30" />
                                    )}
                                    {!hasNextPage &&
                                        transactions.length > 0 && (
                                            <p className="text-[10px] text-foreground/25">
                                                All transactions loaded
                                            </p>
                                        )}
                                </div>
                            </div>
                        )}
                    </CardBody>
                </Card>
            </div>

            {/* ── Add Balance Modal ──────────────────────────── */}
            <Modal
                isOpen={isOpen}
                onClose={onClose}
                placement="center"
                size="sm"
            >
                <ModalContent>
                    <ModalHeader className="flex flex-col items-center gap-1 pb-0">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-green-500">
                            <WalletIcon className="h-5 w-5 text-white" />
                        </div>
                        <span className="text-base font-semibold">
                            Add UC Balance
                        </span>
                        <span className="text-[11px] text-foreground/40">
                            {PLATFORM_FEE_PERCENT}% Razorpay fee included
                        </span>
                    </ModalHeader>

                    <ModalBody className="gap-4">
                        {/* Quick select */}
                        <div className="space-y-2">
                            <span className="text-[11px] font-medium uppercase tracking-wider text-foreground/40">
                                Quick Select
                            </span>
                            <div className="grid grid-cols-4 gap-2">
                                {QUICK_UC_AMOUNTS.map((uc) => (
                                    <Button
                                        key={uc}
                                        size="sm"
                                        variant={
                                            desiredUC === uc
                                                ? "solid"
                                                : "bordered"
                                        }
                                        color={
                                            desiredUC === uc
                                                ? "primary"
                                                : "default"
                                        }
                                        className="text-xs font-semibold"
                                        onPress={() => setDesiredUC(uc)}
                                        isDisabled={isPaymentLoading}
                                    >
                                        {uc} UC
                                    </Button>
                                ))}
                            </div>
                        </div>

                        {/* Custom amount */}
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-medium uppercase tracking-wider text-foreground/40">
                                Custom UC Amount
                            </label>
                            <div className="relative">
                                <input
                                    type="number"
                                    inputMode="numeric"
                                    min={10}
                                    max={9756}
                                    value={desiredUC || ""}
                                    onChange={(e) => {
                                        const n = parseInt(e.target.value, 10);
                                        if (!isNaN(n) && n >= 0) setDesiredUC(n);
                                        else if (e.target.value === "") setDesiredUC(0);
                                    }}
                                    placeholder="Enter UC amount"
                                    disabled={isPaymentLoading}
                                    className="w-full rounded-xl border border-divider bg-default-100 px-4 py-3 text-sm font-medium text-foreground outline-none transition-colors placeholder:text-foreground/30 focus:border-primary focus:ring-1 focus:ring-primary/30 disabled:opacity-50"
                                />
                                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-foreground/30">
                                    UC
                                </span>
                            </div>
                            <p className="text-[10px] text-foreground/30">
                                Min: 10 UC · Max: 9,756 UC (₹10,000)
                            </p>
                        </div>

                        {/* Payment preview */}
                        <div className="space-y-2 rounded-xl bg-gradient-to-br from-success/10 to-success/5 p-4">
                            <div className="flex items-center justify-between text-xs text-foreground/60">
                                <span>UC to receive</span>
                                <span className="font-semibold text-success">
                                    {desiredUC.toLocaleString()} UC
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-xs text-foreground/60">
                                <span>
                                    Razorpay Fee ({PLATFORM_FEE_PERCENT}%)
                                </span>
                                <span className="text-foreground/40">
                                    included
                                </span>
                            </div>
                            <Divider className="my-1" />
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-medium">
                                    You pay
                                </span>
                                <div className="flex items-center gap-0.5">
                                    <IndianRupee className="h-5 w-5" />
                                    <span className="text-2xl font-bold">
                                        {formatRupees(rupeeAmount)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </ModalBody>

                    <ModalFooter className="gap-2">
                        <Button
                            variant="flat"
                            onPress={onClose}
                            isDisabled={isPaymentLoading}
                            className="flex-1"
                        >
                            Cancel
                        </Button>
                        <Button
                            color="success"
                            className="flex-1 font-semibold text-white"
                            isLoading={isPaymentLoading}
                            isDisabled={!isValidAmount}
                            startContent={
                                !isPaymentLoading && (
                                    <CreditCard className="h-4 w-4" />
                                )
                            }
                            onPress={() => createOrder.mutate()}
                        >
                            Pay ₹{formatRupees(rupeeAmount)}
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </div>
    );
}
