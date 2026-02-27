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

// ─── Payment Methods Badge ──────────────────────────────────

const PAYMENT_METHODS = [
    // Google Pay
    <svg key="gpay" width="18" height="18" viewBox="0 0 48 48" fill="none">
        <path fill="#e64a19" d="M42.858,11.975c-4.546-2.624-10.359-1.065-12.985,3.481L23.25,26.927c-1.916,3.312,0.551,4.47,3.301,6.119l6.372,3.678c2.158,1.245,4.914,0.506,6.158-1.649l6.807-11.789C48.176,19.325,46.819,14.262,42.858,11.975z" />
        <path fill="#fbc02d" d="M35.365,16.723l-6.372-3.678c-3.517-1.953-5.509-2.082-6.954,0.214l-9.398,16.275c-2.624,4.543-1.062,10.353,3.481,12.971c3.961,2.287,9.024,0.93,11.311-3.031l9.578-16.59C38.261,20.727,37.523,17.968,35.365,16.723z" />
        <path fill="#43a047" d="M36.591,8.356l-4.476-2.585c-4.95-2.857-11.28-1.163-14.137,3.787L9.457,24.317c-1.259,2.177-0.511,4.964,1.666,6.22l5.012,2.894c2.475,1.43,5.639,0.582,7.069-1.894l9.735-16.86c2.017-3.492,6.481-4.689,9.974-2.672L36.591,8.356z" />
        <path fill="#1e88e5" d="M19.189,13.781l-4.838-2.787c-2.158-1.242-4.914-0.506-6.158,1.646l-5.804,10.03c-2.857,4.936-1.163,11.252,3.787,14.101l3.683,2.121l4.467,2.573l1.939,1.115c-3.442-2.304-4.535-6.92-2.43-10.555l1.503-2.596l5.504-9.51C22.083,17.774,21.344,15.023,19.189,13.781z" />
    </svg>,
    // Paytm
    <svg key="paytm" width="18" height="18" viewBox="0 0 48 48" fill="none">
        <path fill="#0d47a1" d="M5.446 18.01H.548c-.277 0-.502.167-.503.502L0 30.519c-.001.3.196.45.465.45.735 0 1.335 0 2.07 0 .255 0 .465-.125.465-.375 0-1.111 0-2.483 0-3.594l2.126.009c1.399-.092 2.335-.742 2.725-2.052.117-.393.14-.733.14-1.137l.11-2.862C7.999 18.946 6.949 18.181 5.446 18.01zM4.995 23.465C4.995 23.759 4.754 24 4.461 24H3v-3h1.461c.293 0 .534.24.534.535V23.465zM13.938 18h-3.423c-.26 0-.483.08-.483.351 0 .706 0 1.495 0 2.201.028.294.231.448.52.448h2.855c.594 0 .532.972 0 1H11.84C10.101 22 9 23.562 9 25.137c0 .42.005 1.406 0 1.863-.008.651-.014 1.311.112 1.899C9.336 29.939 10.235 31 11.597 31h4.228c.541 0 1.173-.474 1.173-1.101v-8.274C17.026 19.443 15.942 18.117 13.938 18zM14 27.55c0 .248-.202.45-.448.45h-1.105C12.201 28 12 27.798 12 27.55v-2.101C12 25.202 12.201 25 12.447 25h1.105C13.798 25 14 25.202 14 25.449V27.55zM18 18.594v5.608c.124 1.6 1.608 2.798 3.171 2.798h1.414c.597 0 .561.969 0 .969H19.49c-.339 0-.462.177-.462.476v2.152c0 .226.183.396.422.396h2.959c2.416 0 3.592-1.159 3.591-3.757v-8.84c0-.276-.175-.383-.342-.383h-2.302c-.224 0-.355.243-.355.422v5.218c0 .199-.111.316-.29.316H21.41c-.264 0-.409-.143-.409-.396v-5.058C21 18.218 20.88 18 20.552 18c-.778 0-1.442 0-2.22 0C18.067 18 18 18.263 18 18.594z" />
        <path fill="#00adee" d="M27.038 20.569v-2.138c0-.237.194-.431.43-.431H28c1.368-.285 1.851-.62 2.688-1.522.514-.557.966-.704 1.298-.113L32 18h1.569C33.807 18 34 18.194 34 18.431v2.138C34 20.805 33.806 21 33.569 21H32v9.569C32 30.807 31.806 31 31.57 31h-2.14C29.193 31 29 30.807 29 30.569V21h-1.531C27.234 21 27.038 20.806 27.038 20.569zM42.991 30.465c0 .294-.244.535-.539.535h-1.91c-.297 0-.54-.241-.54-.535v-6.623-1.871c0-1.284-2.002-1.284-2.002 0v8.494C38 30.759 37.758 31 37.461 31H35.54C35.243 31 35 30.759 35 30.465V18.537C35 18.241 35.243 18 35.54 18h1.976c.297 0 .539.241.539.537v.292c1.32-1.266 3.302-.973 4.416.228 2.097-2.405 5.69-.262 5.523 2.375 0 2.916-.026 6.093-.026 9.033 0 .294-.244.535-.538.535h-1.891C45.242 31 45 30.759 45 30.465c0-2.786 0-5.701 0-8.44 0-1.307-2-1.37-2 0v8.44H42.991z" />
    </svg>,
    // PhonePe
    <svg key="phonepe" width="18" height="18" viewBox="0 0 48 48" fill="none">
        <path fill="#4527a0" d="M42,37c0,2.762-2.238,5-5,5H11c-2.761,0-5-2.238-5-5V11c0-2.762,2.239-5,5-5h26c2.762,0,5,2.238,5,5V37z" />
        <path fill="#fff" d="M32.267,20.171c0-0.681-0.584-1.264-1.264-1.264h-2.334l-5.35-6.25c-0.486-0.584-1.264-0.778-2.043-0.584l-1.848,0.584c-0.292,0.097-0.389,0.486-0.195,0.681l5.836,5.666h-8.851c-0.292,0-0.486,0.195-0.486,0.486v0.973c0,0.681,0.584,1.506,1.264,1.506h1.972v4.305c0,3.502,1.611,5.544,4.723,5.544c0.973,0,1.378-0.097,2.35-0.486v3.112c0,0.875,0.681,1.556,1.556,1.556h0.786c0.292,0,0.584-0.292,0.584-0.584V21.969h2.812c0.292,0,0.486-0.195,0.486-0.486V20.171z M26.043,28.413c-0.584,0.292-1.362,0.389-1.945,0.389c-1.556,0-2.097-0.778-2.097-2.529v-4.305h4.043V28.413z" />
    </svg>,
    // BHIM UPI
    <svg key="bhim" width="18" height="18" viewBox="0 0 48 48" fill="none">
        <polygon fill="#388e3c" points="29,4 18,45 40,24" />
        <polygon fill="#f57c00" points="21,3 10,44 32,23" />
    </svg>,
    // Cards
    <svg key="cards" width="18" height="18" viewBox="0 0 18 18" fill="none">
        <rect x="2" y="4" width="14" height="10" rx="2" stroke="#fff" strokeWidth="1.3" fill="none" />
        <line x1="2" y1="8" x2="16" y2="8" stroke="#fff" strokeWidth="1.3" />
        <rect x="4" y="10" width="4" height="1.5" rx="0.5" fill="#fff" fillOpacity="0.6" />
    </svg>,
];

function PaymentMethodsBadge() {
    const [idx, setIdx] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setIdx((prev) => (prev + 1) % PAYMENT_METHODS.length);
        }, 1500);
        return () => clearInterval(timer);
    }, []);

    return (
        <AnimatePresence mode="wait">
            <motion.span
                key={idx}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.15 }}
                className="flex items-center"
            >
                {PAYMENT_METHODS[idx]}
            </motion.span>
        </AnimatePresence>
    );
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
                                !isPaymentLoading && <PaymentMethodsBadge />
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
