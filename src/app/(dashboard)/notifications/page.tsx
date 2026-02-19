"use client";

import { useQuery } from "@tanstack/react-query";
import {
    Card,
    CardBody,
    Chip,
    Skeleton,
    Button,
} from "@heroui/react";
import {
    Bell,
    CheckCircle,
    AlertCircle,
    ChevronsDown,
    InboxIcon,
} from "lucide-react";
import { motion } from "motion/react";

interface NotificationDTO {
    id: string;
    title: string;
    message: string;
    type: string;
    link: string | null;
    isRead: boolean;
    createdAt: string;
}

const typeColors: Record<string, "primary" | "success" | "warning" | "danger" | "default"> = {
    tournament: "primary",
    poll: "warning",
    winner: "success",
    ban: "danger",
    system: "default",
};

/**
 * /dashboard/notifications — Admin notification center.
 */
export default function NotificationsPage() {
    const { data, isLoading, error } = useQuery<NotificationDTO[]>({
        queryKey: ["admin-notifications"],
        queryFn: async () => {
            const res = await fetch("/api/notifications");
            if (!res.ok) throw new Error("Failed");
            const json = await res.json();
            return json.data;
        },
        staleTime: 30 * 1000,
    });

    return (
        <div className="mx-auto max-w-xl space-y-6">
            <div>
                <h1 className="text-xl font-bold">Notifications</h1>
                <p className="text-sm text-foreground/50">
                    System and community notifications
                </p>
            </div>

            {error && (
                <div className="flex items-center gap-2 rounded-lg bg-danger-50 p-4 text-sm text-danger dark:bg-danger-50/10">
                    <AlertCircle className="h-4 w-4" />
                    Failed to load notifications.
                </div>
            )}

            {isLoading && (
                <div className="space-y-2">
                    {[1, 2, 3, 4].map((i) => (
                        <Skeleton key={i} className="h-16 w-full rounded-xl" />
                    ))}
                </div>
            )}

            {data && (
                <div className="space-y-2">
                    {data.length === 0 ? (
                        <div className="flex flex-col items-center gap-3 rounded-xl bg-default-100 py-12 text-center">
                            <InboxIcon className="h-10 w-10 text-foreground/20" />
                            <p className="text-sm text-foreground/50">
                                No notifications yet
                            </p>
                        </div>
                    ) : (
                        data.map((n, i) => (
                            <motion.div
                                key={n.id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: i * 0.02 }}
                            >
                                <Card
                                    className={`border ${n.isRead
                                            ? "border-divider"
                                            : "border-primary/30 bg-primary/5"
                                        }`}
                                >
                                    <CardBody className="flex-row items-start gap-3 p-3">
                                        <div
                                            className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${n.isRead ? "bg-default-100" : "bg-primary/10"
                                                }`}
                                        >
                                            <Bell
                                                className={`h-4 w-4 ${n.isRead
                                                        ? "text-foreground/30"
                                                        : "text-primary"
                                                    }`}
                                            />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2">
                                                <h4 className="truncate text-sm font-medium">
                                                    {n.title}
                                                </h4>
                                                <Chip
                                                    size="sm"
                                                    variant="flat"
                                                    color={typeColors[n.type] ?? "default"}
                                                    className="text-[10px]"
                                                >
                                                    {n.type}
                                                </Chip>
                                            </div>
                                            <p className="mt-0.5 text-xs text-foreground/50 line-clamp-2">
                                                {n.message}
                                            </p>
                                            <p className="mt-1 text-[10px] text-foreground/30">
                                                {new Date(n.createdAt).toLocaleString()}
                                            </p>
                                        </div>
                                    </CardBody>
                                </Card>
                            </motion.div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
