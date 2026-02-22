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
} from "@heroui/react";
import {
    Bell,
    BellOff,
    CheckCheck,
    Wallet,
    Trophy,
    Users,
    AlertCircle,
    Info,
    Clock,
    Check,
    X,
    ArrowDownLeft,
    Loader2,
} from "lucide-react";
import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

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

interface NotificationsData {
    notifications: Notification[];
    unreadCount: number;
    pendingRequests: PendingRequest[];
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

export default function NotificationsPage() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const { isOpen, onOpen, onClose } = useDisclosure();

    // Response modal state
    const [selectedRequest, setSelectedRequest] = useState<PendingRequest | null>(null);
    const [responseMessage, setResponseMessage] = useState("");

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
            onClose();
            setSelectedRequest(null);
            setResponseMessage("");
        },
    });

    const notifications = data?.notifications ?? [];
    const unreadCount = data?.unreadCount ?? 0;
    const pendingRequests = data?.pendingRequests ?? [];

    const openResponseModal = (request: PendingRequest) => {
        setSelectedRequest(request);
        setResponseMessage("");
        onOpen();
    };

    // Find matching pending request for a uc_request notification
    const findPendingRequest = (notification: Notification): PendingRequest | null => {
        if (notification.type !== "uc_request") return null;
        return pendingRequests.find((r) =>
            notification.message.includes(r.amount.toString())
        ) ?? null;
    };

    return (
        <div className="mx-auto max-w-lg px-4 py-6 sm:px-6">
            <div className="mb-6 flex items-center justify-between">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <Bell className="h-5 w-5 text-primary" />
                        <h1 className="text-lg font-bold">Notifications</h1>
                        {unreadCount > 0 && (
                            <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-white">
                                {unreadCount}
                            </span>
                        )}
                    </div>
                    <p className="text-sm text-foreground/50">Last 7 days</p>
                </div>
                {unreadCount > 0 && (
                    <Button
                        size="sm"
                        variant="flat"
                        startContent={<CheckCheck className="h-3.5 w-3.5" />}
                        isLoading={markAllRead.isPending}
                        onPress={() => markAllRead.mutate()}
                    >
                        Mark all read
                    </Button>
                )}
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

                {!isLoading && !error && notifications.length === 0 && (
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
                            transition={{ delay: i * 0.03 }}
                        >
                            <Card
                                isPressable={!!notification.link || !!pendingRequest}
                                onPress={() => {
                                    if (pendingRequest) {
                                        openResponseModal(pendingRequest);
                                    } else if (notification.link) {
                                        router.push(notification.link);
                                    }
                                }}
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
            <Modal isOpen={isOpen} onClose={onClose} placement="center" size="sm">
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
        </div>
    );
}
