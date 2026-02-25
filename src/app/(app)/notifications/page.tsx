"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    Card,
    CardBody,
    Skeleton,
    Button,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Textarea,
    useDisclosure,
    Chip,
} from "@heroui/react";
import {
    Bell,
    BellOff,
    CheckCheck,
    Wallet,
    Trophy,
    Users,
    Info,
    Clock,
    Check,
    X,
    ArrowDownLeft,
    Loader2,
    Gift,
    AlertCircle,
    Flame,
    UserPlus,
    Heart,
} from "lucide-react";
import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

interface Notification {
    id: string;
    title: string;
    message: string;
    type: string;
    link: string | null;
    isRead: boolean;
    createdAt: string;
}

interface PendingRequest {
    id: string;
    amount: number;
    message: string | null;
    createdAt: string;
    fromPlayer: {
        id: string;
        displayName: string | null;
        wallet: { balance: number } | null;
        user: { username: string };
    };
}

interface UnclaimedReward {
    id: string;
    type: string;
    amount: number;
    message: string | null;
    details: Record<string, unknown> | null;
    position: number | null;
    createdAt: string;
}

interface NotificationsData {
    notifications: Notification[];
    unreadCount: number;
    pendingRequests: PendingRequest[];
    unclaimedRewards: UnclaimedReward[];
}

const typeIcons: Record<string, typeof Bell> = {
    uc_request: Clock,
    uc_approved: Check,
    uc_request_approved: Check,
    uc_rejected: X,
    uc_request_rejected: X,
    uc_received: ArrowDownLeft,
    tournament: Trophy,
    team: Users,
    system: Info,
};

const typeColors: Record<string, string> = {
    uc_request: "text-warning bg-warning/10",
    uc_approved: "text-success bg-success/10",
    uc_request_approved: "text-success bg-success/10",
    uc_rejected: "text-danger bg-danger/10",
    uc_request_rejected: "text-danger bg-danger/10",
    uc_received: "text-success bg-success/10",
    tournament: "text-primary bg-primary/10",
    team: "text-secondary bg-secondary/10",
    system: "text-foreground/60 bg-foreground/5",
};

const rewardIcons: Record<string, typeof Bell> = {
    WINNER: Trophy,
    SOLO_SUPPORT: Heart,
    REFERRAL: UserPlus,
    STREAK: Flame,
};

const rewardColors: Record<string, string> = {
    WINNER: "text-amber-500 bg-amber-500/10",
    SOLO_SUPPORT: "text-pink-500 bg-pink-500/10",
    REFERRAL: "text-blue-500 bg-blue-500/10",
    STREAK: "text-orange-500 bg-orange-500/10",
};

const rewardLabels: Record<string, string> = {
    WINNER: "Prize Reward",
    SOLO_SUPPORT: "Solo Support",
    REFERRAL: "Referral Bonus",
    STREAK: "Streak Reward",
};

function timeAgo(date: string) {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return "just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
}

function getOrdinal(n: number): string {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export default function NotificationsPage() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const { isOpen, onOpen, onClose } = useDisclosure();

    // Modal modes
    const [modalMode, setModalMode] = useState<"uc_request" | "reward_detail">("uc_request");

    // UC request modal state
    const [selectedRequest, setSelectedRequest] = useState<PendingRequest | null>(null);
    const [responseMessage, setResponseMessage] = useState("");

    // Reward detail modal state
    const [selectedReward, setSelectedReward] = useState<UnclaimedReward | null>(null);

    const { data, isLoading, error } = useQuery<NotificationsData>({
        queryKey: ["notifications"],
        queryFn: async () => {
            const res = await fetch("/api/notifications");
            if (!res.ok) throw new Error("Failed to fetch");
            const json = await res.json();
            return json.data;
        },
        staleTime: 30 * 1000,
    });

    const markAllRead = useMutation({
        mutationFn: async () => {
            const res = await fetch("/api/notifications/read-all", { method: "POST" });
            if (!res.ok) throw new Error("Failed");
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["notifications"] });
            queryClient.invalidateQueries({ queryKey: ["notification-count"] });
        },
    });

    const approveTransfer = useMutation({
        mutationFn: async (id: string) => {
            const res = await fetch(`/api/uc-transfers/${id}/approve`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ responseMessage: responseMessage || undefined }),
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to approve");
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["notifications"] });
            queryClient.invalidateQueries({ queryKey: ["notification-count"] });
            queryClient.invalidateQueries({ queryKey: ["wallet"] });
            queryClient.invalidateQueries({ queryKey: ["profile"] });
            onClose();
            setSelectedRequest(null);
            setResponseMessage("");
        },
    });

    const rejectTransfer = useMutation({
        mutationFn: async (id: string) => {
            const res = await fetch(`/api/uc-transfers/${id}/reject`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ responseMessage: responseMessage || undefined }),
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to reject");
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["notifications"] });
            queryClient.invalidateQueries({ queryKey: ["notification-count"] });
            onClose();
            setSelectedRequest(null);
            setResponseMessage("");
        },
    });

    const claimReward = useMutation({
        mutationFn: async (id: string) => {
            const res = await fetch(`/api/rewards/${id}/claim`, { method: "POST" });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || data.message || "Failed to claim");
            }
            return res.json();
        },
        onSuccess: (data) => {
            const amount = data?.data?.amount ?? 0;
            toast.success(`🎉 Claimed ${amount} UC!`);
            queryClient.invalidateQueries({ queryKey: ["notifications"] });
            queryClient.invalidateQueries({ queryKey: ["notification-count"] });
            queryClient.invalidateQueries({ queryKey: ["wallet"] });
            queryClient.invalidateQueries({ queryKey: ["profile"] });
            queryClient.invalidateQueries({ queryKey: ["royal-pass"] });
            onClose();
            setSelectedReward(null);
        },
        onError: (err: Error) => {
            toast.error(err.message);
        },
    });

    const notifications = data?.notifications ?? [];
    const unreadCount = data?.unreadCount ?? 0;
    const pendingRequests = data?.pendingRequests ?? [];
    const unclaimedRewards = data?.unclaimedRewards ?? [];

    const openRequestModal = (request: PendingRequest) => {
        setModalMode("uc_request");
        setSelectedRequest(request);
        setResponseMessage("");
        onOpen();
    };

    const openRewardModal = (reward: UnclaimedReward) => {
        setModalMode("reward_detail");
        setSelectedReward(reward);
        onOpen();
    };

    // Find matching pending request for a uc_request notification
    const findPendingRequest = (notification: Notification): PendingRequest | null => {
        if (notification.type !== "uc_request") return null;
        return pendingRequests.find((r) =>
            notification.message.includes(r.amount.toString())
        ) ?? null;
    };

    const hasActionItems = unclaimedRewards.length > 0 || pendingRequests.length > 0;

    return (
        <div className="mx-auto max-w-xl px-4 py-6 sm:px-6">
            <div className="mb-6 flex items-center justify-between">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <Bell className="h-5 w-5 text-primary" />
                        <h1 className="text-lg font-bold">Notifications</h1>
                        {(unreadCount > 0 || unclaimedRewards.length > 0) && (
                            <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-white">
                                {unreadCount + unclaimedRewards.length}
                            </span>
                        )}
                    </div>
                    <p className="text-sm text-foreground/50">Last 7 days</p>
                </div>
            </div>

            <div className="space-y-2">
                {isLoading && (
                    <>
                        {[1, 2, 3, 4, 5].map((i) => (
                            <Skeleton key={i} className="h-16 w-full rounded-xl" />
                        ))}
                    </>
                )}

                {error && (
                    <Card className="border border-divider">
                        <CardBody className="flex flex-row items-center gap-3 py-6">
                            <AlertCircle className="h-5 w-5 text-danger" />
                            <p className="text-sm text-danger">Failed to load notifications</p>
                        </CardBody>
                    </Card>
                )}

                {/* Claimable Rewards Section */}
                {!isLoading && unclaimedRewards.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <Card className="border border-divider overflow-hidden">
                            <div className="flex items-center gap-1.5 px-3 pt-3 pb-1">
                                <Gift className="h-3.5 w-3.5 text-foreground/40" />
                                <p className="text-[11px] font-semibold uppercase tracking-wider text-foreground/40">
                                    Claimable Rewards
                                </p>
                                <span className="ml-auto rounded-full bg-success/15 px-1.5 py-0.5 text-[10px] font-bold text-success">
                                    {unclaimedRewards.length}
                                </span>
                            </div>
                            <CardBody className="gap-0 p-0">
                                {unclaimedRewards.map((reward, i) => {
                                    const Icon = rewardIcons[reward.type] || Gift;
                                    const colorClass = rewardColors[reward.type] || "text-success bg-success/10";
                                    const label = rewardLabels[reward.type] || reward.type;
                                    const details = reward.details as Record<string, unknown> | null;

                                    return (
                                        <motion.div
                                            key={reward.id}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: i * 0.04 }}
                                            onClick={() => openRewardModal(reward)}
                                            className={`flex cursor-pointer items-center gap-3 px-3 py-2.5 transition-colors hover:bg-foreground/5 active:bg-foreground/10 ${i > 0 ? "border-t border-divider/50" : ""}`}
                                        >
                                            <div
                                                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${colorClass}`}
                                            >
                                                <Icon className="h-3.5 w-3.5" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-[13px] font-medium">
                                                    {label}
                                                    {reward.position ? ` · ${getOrdinal(reward.position)}` : ""}
                                                </p>
                                                <p className="text-[11px] text-foreground/40 line-clamp-1">
                                                    {reward.message || (details?.tournamentName ? String(details.tournamentName) : null) || "Tap to claim"}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[13px] font-bold text-success">
                                                    +{reward.amount}
                                                </span>
                                                <div className="flex h-6 items-center rounded-md bg-success/15 px-2">
                                                    <span className="text-[10px] font-semibold text-success">Claim</span>
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </CardBody>
                        </Card>
                    </motion.div>
                )}

                {/* Pending UC requests shown inline (if not already matched to a notification) */}
                {!isLoading && pendingRequests.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: unclaimedRewards.length * 0.04 }}
                        className="space-y-2"
                    >
                        {unclaimedRewards.length > 0 && (
                            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-foreground/40 mt-2">
                                <Clock className="h-3.5 w-3.5" />
                                Pending Requests
                            </p>
                        )}
                    </motion.div>
                )}

                {/* Divider between action items and regular notifications */}
                {!isLoading && notifications.length > 0 && (
                    <div className="flex items-center gap-3 py-1">
                        <div className="h-px flex-1 bg-divider" />
                        <span className="text-[10px] font-medium uppercase tracking-wider text-foreground/30">
                            Recent Activity
                        </span>
                        <div className="h-px flex-1 bg-divider" />
                        {unreadCount > 0 && (
                            <Button
                                size="sm"
                                variant="light"
                                className="h-6 min-w-0 px-2 text-[10px] text-foreground/40"
                                startContent={<CheckCheck className="h-3 w-3" />}
                                isLoading={markAllRead.isPending}
                                onPress={() => markAllRead.mutate()}
                            >
                                Read all
                            </Button>
                        )}
                    </div>
                )}

                {/* Empty state */}
                {!isLoading && !error && notifications.length === 0 && unclaimedRewards.length === 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <Card className="border border-divider">
                            <CardBody className="flex flex-col items-center gap-3 py-12">
                                <BellOff className="h-10 w-10 text-foreground/15" />
                                <p className="text-sm text-foreground/40">No notifications yet</p>
                            </CardBody>
                        </Card>
                    </motion.div>
                )}

                {/* Regular Notifications */}
                {notifications.map((notification, i) => {
                    const Icon = typeIcons[notification.type] || Bell;
                    const colorClass =
                        typeColors[notification.type] || "text-foreground/60 bg-foreground/5";
                    const pendingRequest = findPendingRequest(notification);

                    return (
                        <motion.div
                            key={notification.id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: (hasActionItems ? 0.1 : 0) + i * 0.03 }}
                        >
                            <Card
                                isPressable={!!notification.link || !!pendingRequest}
                                onPress={() => {
                                    if (pendingRequest) {
                                        openRequestModal(pendingRequest);
                                    } else if (notification.link) {
                                        router.push(notification.link);
                                    }
                                }}
                                fullWidth
                                className={`border transition-colors ${notification.isRead
                                    ? "border-divider"
                                    : "border-primary/20 bg-primary/[0.02]"
                                    }`}
                            >
                                <CardBody className="flex flex-row items-start gap-3 p-3">
                                    <div
                                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${colorClass}`}
                                    >
                                        <Icon className="h-4 w-4" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-start justify-between gap-2">
                                            <p
                                                className={`text-sm ${notification.isRead
                                                    ? "text-foreground/70"
                                                    : "font-semibold text-foreground"
                                                    }`}
                                            >
                                                {notification.title}
                                            </p>
                                            {!notification.isRead && (
                                                <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                                            )}
                                        </div>
                                        <p className="mt-0.5 text-xs text-foreground/50">
                                            {notification.message}
                                        </p>
                                        <div className="mt-1 flex items-center justify-between">
                                            <p className="text-[10px] text-foreground/30">
                                                {timeAgo(notification.createdAt)}
                                            </p>
                                            {pendingRequest && (
                                                <p className="text-[11px] font-medium text-primary">
                                                    Tap to respond
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </CardBody>
                            </Card>
                        </motion.div>
                    );
                })}
            </div>

            {/* UC Request Response Modal */}
            <Modal
                isOpen={isOpen && modalMode === "uc_request"}
                onClose={onClose}
                placement="center"
                size="sm"
            >
                <ModalContent>
                    {selectedRequest && (
                        <>
                            <ModalHeader className="flex flex-col items-center gap-1 pb-0">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500">
                                    <Wallet className="h-5 w-5 text-white" />
                                </div>
                                <span className="text-base font-semibold">UC Request</span>
                            </ModalHeader>
                            <ModalBody className="gap-3 text-center">
                                <p className="text-sm text-foreground/70">
                                    <span className="font-semibold text-foreground">
                                        {selectedRequest.fromPlayer.displayName ||
                                            selectedRequest.fromPlayer.user.username}
                                    </span>{" "}
                                    requested{" "}
                                    <span className="font-semibold text-foreground">
                                        {selectedRequest.amount.toLocaleString()} UC
                                    </span>
                                </p>
                                <p className="text-xs text-foreground/50">
                                    Their balance:{" "}
                                    <span
                                        className={`font-semibold ${(selectedRequest.fromPlayer.wallet?.balance ?? 0) >= 0
                                            ? "text-success"
                                            : "text-danger"
                                            }`}
                                    >
                                        {(selectedRequest.fromPlayer.wallet?.balance ?? 0).toLocaleString()} UC
                                    </span>
                                </p>
                                {selectedRequest.message && (
                                    <p className="text-xs italic text-primary">
                                        &ldquo;{selectedRequest.message}&rdquo;
                                    </p>
                                )}
                                <Textarea
                                    label="Message (optional)"
                                    placeholder="Add a message..."
                                    value={responseMessage}
                                    onValueChange={setResponseMessage}
                                    maxLength={200}
                                    minRows={2}
                                    size="sm"
                                />
                            </ModalBody>
                            <ModalFooter className="gap-2">
                                <Button
                                    color="danger"
                                    variant="flat"
                                    className="flex-1"
                                    isLoading={rejectTransfer.isPending}
                                    isDisabled={approveTransfer.isPending}
                                    startContent={
                                        !rejectTransfer.isPending && <X className="h-4 w-4" />
                                    }
                                    onPress={() => rejectTransfer.mutate(selectedRequest.id)}
                                >
                                    Reject
                                </Button>
                                <Button
                                    color="success"
                                    className="flex-1 text-white"
                                    isLoading={approveTransfer.isPending}
                                    isDisabled={rejectTransfer.isPending}
                                    startContent={
                                        !approveTransfer.isPending && <Check className="h-4 w-4" />
                                    }
                                    onPress={() => approveTransfer.mutate(selectedRequest.id)}
                                >
                                    Accept
                                </Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>

            {/* Reward Detail + Claim Modal */}
            <Modal
                isOpen={isOpen && modalMode === "reward_detail"}
                onClose={onClose}
                placement="center"
                size="sm"
            >
                <ModalContent>
                    {selectedReward && (() => {
                        const Icon = rewardIcons[selectedReward.type] || Gift;
                        const colorClass = rewardColors[selectedReward.type] || "text-success bg-success/10";
                        const label = rewardLabels[selectedReward.type] || selectedReward.type;
                        const details = selectedReward.details as Record<string, unknown> | null;

                        return (
                            <>
                                <ModalHeader className="flex flex-col items-center gap-1 pb-0">
                                    <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${colorClass}`}>
                                        <Icon className="h-6 w-6" />
                                    </div>
                                    <span className="text-base font-semibold">{label}</span>
                                    {selectedReward.position && (
                                        <Chip size="sm" variant="flat" color="warning" className="text-[10px]">
                                            {getOrdinal(selectedReward.position)} Place
                                        </Chip>
                                    )}
                                </ModalHeader>
                                <ModalBody className="gap-3 text-center">
                                    {/* Amount */}
                                    <div className="rounded-xl bg-success/10 py-3">
                                        <p className="text-2xl font-bold text-success">
                                            +{selectedReward.amount} UC
                                        </p>
                                    </div>

                                    {/* Message */}
                                    {selectedReward.message && (
                                        <p className="text-sm text-foreground/70">
                                            {selectedReward.message}
                                        </p>
                                    )}

                                    {/* Details */}
                                    {details && (
                                        <div className="space-y-1.5 rounded-lg bg-default-50 p-3 text-left">
                                            {!!details.tournamentName && (
                                                <div className="flex items-center justify-between text-xs">
                                                    <span className="text-foreground/50">Tournament</span>
                                                    <span className="font-medium">{String(details.tournamentName)}</span>
                                                </div>
                                            )}
                                            {details.baseShare != null && (
                                                <div className="flex items-center justify-between text-xs">
                                                    <span className="text-foreground/50">Base Share</span>
                                                    <span className="font-medium">{Number(details.baseShare)} UC</span>
                                                </div>
                                            )}
                                            {Number(details.participationAdj) !== 0 && details.participationAdj != null && (
                                                <div className="flex items-center justify-between text-xs">
                                                    <span className="text-foreground/50">Participation Adjustment</span>
                                                    <span className={`font-medium ${Number(details.participationAdj) > 0 ? "text-success" : "text-danger"}`}>
                                                        {Number(details.participationAdj) > 0 ? "+" : ""}{Number(details.participationAdj)} UC
                                                    </span>
                                                </div>
                                            )}
                                            {Number(details.repeatTax) > 0 && (
                                                <div className="flex items-center justify-between text-xs">
                                                    <span className="text-foreground/50">Repeat Winner Tax</span>
                                                    <span className="font-medium text-danger">-{Number(details.repeatTax)} UC</span>
                                                </div>
                                            )}
                                            {Number(details.soloTax) > 0 && (
                                                <div className="flex items-center justify-between text-xs">
                                                    <span className="text-foreground/50">Solo Tax</span>
                                                    <span className="font-medium text-danger">-{Number(details.soloTax)} UC</span>
                                                </div>
                                            )}
                                            {details.matchesPlayed != null && (
                                                <div className="flex items-center justify-between text-xs">
                                                    <span className="text-foreground/50">Matches Played</span>
                                                    <span className="font-medium">{Number(details.matchesPlayed)}/{Number(details.totalMatches)}</span>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <p className="text-[10px] text-foreground/30">
                                        {new Date(selectedReward.createdAt).toLocaleDateString("en-IN", {
                                            day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
                                        })}
                                    </p>
                                </ModalBody>
                                <ModalFooter>
                                    <Button
                                        fullWidth
                                        color="success"
                                        className="text-white font-semibold"
                                        size="lg"
                                        isLoading={claimReward.isPending}
                                        startContent={
                                            !claimReward.isPending && <Gift className="h-5 w-5" />
                                        }
                                        onPress={() => claimReward.mutate(selectedReward.id)}
                                    >
                                        Claim {selectedReward.amount} UC
                                    </Button>
                                </ModalFooter>
                            </>
                        );
                    })()}
                </ModalContent>
            </Modal>
        </div>
    );
}
