"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    Card,
    CardBody,
    CardHeader,
    Chip,
    Button,
    Skeleton,
    Divider,
} from "@heroui/react";
import {
    Briefcase,
    AlertCircle,
    Trash2,
    ShieldBan,
    ShieldCheck,
    Eye,
    ThumbsUp,
    ThumbsDown,
    Phone,
    MapPin,
    Clock,
} from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { useState } from "react";

// ─── Types ───────────────────────────────────────────────────

interface JobListing {
    id: string;
    playerId: string;
    category: string;
    category2?: string;
    customCategory?: string;
    title: string;
    description?: string;
    phoneNumber: string;
    experience?: string;
    location?: string;
    availability?: string;
    isActive: boolean;
    isJobBanned: boolean;
    likeCount: number;
    dislikeCount: number;
    createdAt: string;
    player?: {
        id: string;
        displayName: string | null;
        user: { username: string };
    };
}

// ─── Page ────────────────────────────────────────────────────

export default function JobListingsPage() {
    const queryClient = useQueryClient();
    const [filter, setFilter] = useState<"all" | "active" | "banned">("all");

    const { data: listings, isLoading, error } = useQuery<JobListing[]>({
        queryKey: ["admin-job-listings"],
        queryFn: async () => {
            const res = await fetch("/api/job-listings");
            if (!res.ok) throw new Error("Failed to fetch");
            const json = await res.json();
            return json.data;
        },
    });

    const toggleBan = useMutation({
        mutationFn: async ({ id, ban }: { id: string; ban: boolean }) => {
            const res = await fetch(`/api/job-listings/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isJobBanned: ban }),
            });
            if (!res.ok) throw new Error("Failed to update");
        },
        onSuccess: (_, { ban }) => {
            toast.success(ban ? "Listing banned" : "Listing unbanned");
            queryClient.invalidateQueries({ queryKey: ["admin-job-listings"] });
        },
    });

    const deleteListing = useMutation({
        mutationFn: async (id: string) => {
            const res = await fetch(`/api/job-listings/${id}`, {
                method: "DELETE",
            });
            if (!res.ok) throw new Error("Failed to delete");
        },
        onSuccess: () => {
            toast.success("Listing deleted");
            queryClient.invalidateQueries({ queryKey: ["admin-job-listings"] });
        },
    });

    const filtered = listings?.filter((l) => {
        if (filter === "active") return l.isActive && !l.isJobBanned;
        if (filter === "banned") return l.isJobBanned;
        return true;
    });

    return (
        <div className="mx-auto max-w-4xl space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold">Job Listings</h1>
                    <p className="text-sm text-foreground/50">
                        Manage all player job listings
                    </p>
                </div>
                {listings && (
                    <Chip variant="flat" size="sm">
                        {listings.length} total
                    </Chip>
                )}
            </div>

            {/* Filters */}
            <div className="flex gap-2">
                {(["all", "active", "banned"] as const).map((f) => (
                    <Button
                        key={f}
                        size="sm"
                        variant={filter === f ? "solid" : "flat"}
                        color={f === "banned" ? "danger" : "default"}
                        onPress={() => setFilter(f)}
                        className="capitalize"
                    >
                        {f}
                    </Button>
                ))}
            </div>

            {/* Loading */}
            {isLoading && (
                <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-32 w-full rounded-xl" />
                    ))}
                </div>
            )}

            {/* Error */}
            {error && (
                <div className="flex items-center gap-2 rounded-lg bg-danger-50 p-4 text-sm text-danger dark:bg-danger-50/10">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    Failed to load job listings
                </div>
            )}

            {/* Listings */}
            {filtered && (
                <div className="space-y-3">
                    {filtered.length === 0 ? (
                        <div className="flex flex-col items-center gap-2 rounded-xl bg-default-100 py-12 text-center">
                            <Briefcase className="h-8 w-8 text-foreground/20" />
                            <p className="text-sm text-foreground/40">
                                No listings found
                            </p>
                        </div>
                    ) : (
                        filtered.map((listing, i) => (
                            <motion.div
                                key={listing.id}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.03 }}
                            >
                                <Card
                                    className={`border ${listing.isJobBanned
                                        ? "border-danger/30 bg-danger/5"
                                        : "border-divider"
                                        }`}
                                >
                                    <CardBody className="gap-3 p-4">
                                        <div className="flex items-start justify-between">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-semibold">
                                                        {listing.title}
                                                    </h3>
                                                    {listing.isJobBanned && (
                                                        <Chip
                                                            size="sm"
                                                            color="danger"
                                                            variant="flat"
                                                        >
                                                            Banned
                                                        </Chip>
                                                    )}
                                                </div>
                                                <p className="text-xs text-foreground/50">
                                                    by{" "}
                                                    <span className="font-medium text-foreground/70">
                                                        {listing.player?.displayName ||
                                                            listing.player?.user?.username ||
                                                            "Unknown"}
                                                    </span>
                                                </p>
                                            </div>
                                            <Chip
                                                size="sm"
                                                variant="flat"
                                                color="primary"
                                            >
                                                {listing.category}
                                            </Chip>
                                        </div>

                                        {listing.description && (
                                            <p className="text-xs text-foreground/60">
                                                {listing.description}
                                            </p>
                                        )}

                                        <div className="flex flex-wrap items-center gap-3 text-[11px] text-foreground/40">
                                            <span className="flex items-center gap-1">
                                                <Phone className="h-3 w-3" />
                                                {listing.phoneNumber}
                                            </span>
                                            {listing.location && (
                                                <span className="flex items-center gap-1">
                                                    <MapPin className="h-3 w-3" />
                                                    {listing.location}
                                                </span>
                                            )}
                                            {listing.experience && (
                                                <span className="flex items-center gap-1">
                                                    <Clock className="h-3 w-3" />
                                                    {listing.experience}
                                                </span>
                                            )}
                                            <span className="flex items-center gap-1">
                                                <ThumbsUp className="h-3 w-3" />
                                                {listing.likeCount}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <ThumbsDown className="h-3 w-3" />
                                                {listing.dislikeCount}
                                            </span>
                                        </div>

                                        <Divider />

                                        <div className="flex items-center gap-2">
                                            <Button
                                                size="sm"
                                                variant="flat"
                                                color={listing.isJobBanned ? "success" : "warning"}
                                                startContent={
                                                    listing.isJobBanned ? (
                                                        <ShieldCheck className="h-3.5 w-3.5" />
                                                    ) : (
                                                        <ShieldBan className="h-3.5 w-3.5" />
                                                    )
                                                }
                                                isLoading={toggleBan.isPending}
                                                onPress={() =>
                                                    toggleBan.mutate({
                                                        id: listing.id,
                                                        ban: !listing.isJobBanned,
                                                    })
                                                }
                                            >
                                                {listing.isJobBanned ? "Unban" : "Ban"}
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="flat"
                                                color="danger"
                                                startContent={
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                }
                                                isLoading={deleteListing.isPending}
                                                onPress={() => {
                                                    if (
                                                        confirm(
                                                            `Delete "${listing.title}"?`
                                                        )
                                                    ) {
                                                        deleteListing.mutate(listing.id);
                                                    }
                                                }}
                                            >
                                                Delete
                                            </Button>
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
