"use client";

import { useQuery } from "@tanstack/react-query";
import {
    Card,
    CardBody,
    Avatar,
    Chip,
    Skeleton,
} from "@heroui/react";
import {
    Shield,
    AlertCircle,
    Crown,
} from "lucide-react";
import { motion } from "motion/react";

interface AdminUser {
    id: string;
    username: string;
    email: string;
    imageUrl: string | null;
    role: string;
    createdAt: string;
}

/**
 * /dashboard/admins — View admin and super admin users.
 */
export default function AdminsPage() {
    const { data, isLoading, error } = useQuery<AdminUser[]>({
        queryKey: ["admins"],
        queryFn: async () => {
            const res = await fetch("/api/admins");
            if (!res.ok) throw new Error("Failed");
            const json = await res.json();
            return json.data;
        },
        staleTime: 60 * 1000,
    });

    return (
        <div className="mx-auto max-w-lg space-y-6">
            <div>
                <h1 className="text-xl font-bold">Admins</h1>
                <p className="text-sm text-foreground/50">
                    Users with admin or super admin privileges
                </p>
            </div>

            {error && (
                <div className="flex items-center gap-2 rounded-lg bg-danger-50 p-4 text-sm text-danger dark:bg-danger-50/10">
                    <AlertCircle className="h-4 w-4" />
                    Failed to load admin users.
                </div>
            )}

            {isLoading && (
                <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-16 w-full rounded-xl" />
                    ))}
                </div>
            )}

            {data && (
                <div className="space-y-2">
                    {data.length === 0 ? (
                        <div className="flex flex-col items-center gap-3 rounded-xl bg-default-100 py-12 text-center">
                            <Shield className="h-10 w-10 text-foreground/20" />
                            <p className="text-sm text-foreground/50">No admin users found</p>
                        </div>
                    ) : (
                        data.map((admin, i) => (
                            <motion.div
                                key={admin.id}
                                initial={{ opacity: 0, y: 4 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.03 }}
                            >
                                <Card className="border border-divider">
                                    <CardBody className="flex-row items-center gap-3 p-3">
                                        <Avatar
                                            src={admin.imageUrl || undefined}
                                            name={admin.username}
                                            size="md"
                                        />
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-medium">
                                                {admin.username}
                                            </p>
                                            <p className="truncate text-xs text-foreground/40">
                                                {admin.email}
                                            </p>
                                        </div>
                                        <Chip
                                            size="sm"
                                            variant="flat"
                                            color={admin.role === "SUPER_ADMIN" ? "warning" : "primary"}
                                            startContent={
                                                admin.role === "SUPER_ADMIN" ? (
                                                    <Crown className="h-3 w-3" />
                                                ) : (
                                                    <Shield className="h-3 w-3" />
                                                )
                                            }
                                        >
                                            {admin.role === "SUPER_ADMIN" ? "Super Admin" : "Admin"}
                                        </Chip>
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
