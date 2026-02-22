"use client";

import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
    Card,
    CardBody,
    Avatar,
    Chip,
    Divider,
    Skeleton,
    Button,
} from "@heroui/react";
import {
    Target,
    Swords,
    Skull,
    Gamepad2,
    Wallet,
    Flame,
    Trophy,
    Crown,
    Shield,
    User,
    AlertCircle,
    Camera,
    Loader2,
    ImagePlus,
    LogOut,
} from "lucide-react";
import { motion } from "motion/react";
import { CategoryBadge } from "@/components/ui/category-badge";
import { useClerk } from "@clerk/nextjs";

interface ProfileData {
    id: string;
    username: string;
    email: string;
    imageUrl: string | null;
    role: string;
    player: {
        id: string;
        displayName: string | null;
        bio: string | null;
        category: string;
        hasRoyalPass: boolean;
        isBanned: boolean;
        characterImage: {
            url: string;
            thumbnailUrl: string | null;
            isAnimated: boolean;
            isVideo: boolean;
        } | null;
        stats: {
            kills: number;
            deaths: number;
            matches: number;
            kd: number;
        } | null;
        wallet: {
            balance: number;
        };
        streak: {
            current: number;
            longest: number;
        } | null;
    } | null;
}

/**
 * /profile — User's profile page.
 * Shows character hero, stats grid, wallet balance, and streak info.
 */
export default function ProfilePage() {
    const queryClient = useQueryClient();
    const clerk = useClerk();
    const profileInputRef = useRef<HTMLInputElement>(null);
    const characterInputRef = useRef<HTMLInputElement>(null);
    const [uploadingProfile, setUploadingProfile] = useState(false);
    const [uploadingCharacter, setUploadingCharacter] = useState(false);
    const [previewProfileUrl, setPreviewProfileUrl] = useState<string | null>(null);
    const [previewCharacter, setPreviewCharacter] = useState<{ url: string; isVideo: boolean } | null>(null);

    const { data: profile, isLoading, error } = useQuery<ProfileData>({
        queryKey: ["profile"],
        queryFn: async () => {
            const res = await fetch("/api/profile");
            if (!res.ok) throw new Error("Failed to fetch profile");
            const json = await res.json();
            return json.data;
        },
        staleTime: 60 * 1000,
    });

    if (isLoading) {
        return (
            <div className="mx-auto max-w-lg px-4 py-6 sm:px-6">
                <div className="space-y-4">
                    <Skeleton className="h-48 w-full rounded-xl" />
                    <div className="grid grid-cols-2 gap-3">
                        {[1, 2, 3, 4].map((i) => (
                            <Skeleton key={i} className="h-20 rounded-xl" />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (error || !profile) {
        return (
            <div className="mx-auto max-w-lg px-4 py-6 sm:px-6">
                <div className="flex items-center gap-2 rounded-lg bg-danger-50 p-4 text-sm text-danger dark:bg-danger-50/10">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    Failed to load profile.
                </div>
            </div>
        );
    }

    const player = profile.player;
    const stats = player?.stats;
    const name = player?.displayName || profile.username;

    return (
        <div className="mx-auto max-w-lg px-4 py-6 sm:px-6">
            <div className="space-y-4">
                {/* Hero card */}
                <Card className="overflow-hidden border border-divider">
                    <div className="relative h-96 w-full group">
                        {(previewCharacter?.url || player?.characterImage?.url) ? (
                            (previewCharacter?.isVideo || (!previewCharacter && player?.characterImage?.isVideo)) ? (
                                <video
                                    src={previewCharacter?.url || player?.characterImage?.url}
                                    autoPlay
                                    muted
                                    playsInline
                                    className="h-full w-full object-cover"
                                    style={{ objectPosition: "50% 25%" }}
                                />
                            ) : (
                                <img
                                    src={previewCharacter?.url || player?.characterImage?.url}
                                    alt=""
                                    className="h-full w-full object-cover"
                                    style={{ objectPosition: "50% 25%" }}
                                />
                            )
                        ) : (
                            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                                <User className="h-16 w-16 text-primary/30" />
                            </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

                        {/* Character image upload overlay */}
                        <input
                            ref={characterInputRef}
                            type="file"
                            accept="image/*,video/*"
                            className="hidden"
                            onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                setUploadingCharacter(true);
                                try {
                                    const fd = new FormData();
                                    fd.append("image", file);
                                    const res = await fetch("/api/profile/upload-character-image", {
                                        method: "POST",
                                        body: fd,
                                    });
                                    if (res.ok) {
                                        // Instant preview
                                        const localUrl = URL.createObjectURL(file);
                                        setPreviewCharacter({ url: localUrl, isVideo: file.type.startsWith("video/") });
                                        queryClient.invalidateQueries({ queryKey: ["profile"] });
                                    }
                                } finally {
                                    setUploadingCharacter(false);
                                    e.target.value = "";
                                }
                            }}
                        />
                        <button
                            onClick={() => characterInputRef.current?.click()}
                            disabled={uploadingCharacter}
                            className="absolute right-3 top-3 flex items-center gap-1.5 rounded-full bg-black/50 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm transition-opacity hover:bg-black/70 disabled:opacity-50"
                        >
                            {uploadingCharacter ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                                <ImagePlus className="h-3.5 w-3.5" />
                            )}
                            {uploadingCharacter ? "Uploading..." : "Change"}
                        </button>

                        {/* Profile info */}
                        <div className="absolute bottom-3 left-4 flex items-end gap-3">
                            {/* Profile image with upload */}
                            <div className="relative">
                                <Avatar
                                    src={previewProfileUrl || profile.imageUrl || undefined}
                                    name={name}
                                    className="h-16 w-16 ring-2 ring-background"
                                />
                                <input
                                    ref={profileInputRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={async (e) => {
                                        const file = e.target.files?.[0];
                                        if (!file) return;
                                        setUploadingProfile(true);
                                        try {
                                            const fd = new FormData();
                                            fd.append("image", file);
                                            const res = await fetch("/api/profile/upload-profile-image", {
                                                method: "POST",
                                                body: fd,
                                            });
                                            if (res.ok) {
                                                // Instant preview
                                                setPreviewProfileUrl(URL.createObjectURL(file));
                                                queryClient.invalidateQueries({ queryKey: ["profile"] });
                                            }
                                        } finally {
                                            setUploadingProfile(false);
                                            e.target.value = "";
                                        }
                                    }}
                                />
                                <button
                                    onClick={() => profileInputRef.current?.click()}
                                    disabled={uploadingProfile}
                                    className="absolute -bottom-0.5 -right-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white shadow-sm transition-transform hover:scale-110 disabled:opacity-50"
                                >
                                    {uploadingProfile ? (
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                    ) : (
                                        <Camera className="h-3 w-3" />
                                    )}
                                </button>
                            </div>
                            <div className="pb-0.5">
                                <div className="flex items-center gap-2">
                                    <h1 className="text-xl font-bold text-white drop-shadow">
                                        {name}
                                    </h1>
                                    {player?.hasRoyalPass && (
                                        <Crown className="h-4 w-4 text-yellow-400" />
                                    )}
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                    <span className="text-white/60">@{profile.username}</span>
                                    {player && (
                                        <CategoryBadge
                                            category={player.category}
                                            size="sm"
                                        />
                                    )}
                                    {profile.role !== "PLAYER" && (
                                        <Chip
                                            size="sm"
                                            variant="flat"
                                            color="primary"
                                            startContent={<Shield className="h-3 w-3" />}
                                        >
                                            {profile.role}
                                        </Chip>
                                    )}
                                </div>
                                {player?.bio && (
                                    <p className="mt-1 text-xs italic text-white/60">
                                        {player.bio}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </Card>

                {/* No player yet */}
                {!player && (
                    <div className="flex flex-col items-center gap-3 rounded-xl bg-default-100 py-8 text-center">
                        <User className="h-10 w-10 text-foreground/20" />
                        <p className="text-sm text-foreground/50">
                            You don&apos;t have a player profile yet. Ask an admin to add
                            you!
                        </p>
                    </div>
                )}

                {/* Stats grid */}
                {stats && (
                    <div className="grid grid-cols-2 gap-3">
                        {[
                            {
                                label: "K/D Ratio",
                                value: isFinite(stats.kd ?? 0) ? (stats.kd ?? 0).toFixed(2) : "0.00",
                                icon: Target,
                                color: "text-primary",
                            },
                            {
                                label: "Total Kills",
                                value: (stats.kills ?? 0).toLocaleString(),
                                icon: Swords,
                                color: "text-danger",
                            },
                            {
                                label: "Matches",
                                value: (stats.matches ?? 0).toLocaleString(),
                                icon: Gamepad2,
                                color: "text-success",
                            },
                        ].map((stat, i) => (
                            <motion.div
                                key={stat.label}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: i * 0.05 }}
                            >
                                <Card className="border border-divider">
                                    <CardBody className="p-3">
                                        <div className="flex items-center gap-2">
                                            <stat.icon className={`h-4 w-4 ${stat.color}`} />
                                            <span className="text-xs text-foreground/50">
                                                {stat.label}
                                            </span>
                                        </div>
                                        <p className="mt-1 text-xl font-bold">{stat.value}</p>
                                    </CardBody>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                )}


                {/* Sign Out */}
                <div className="mt-6 pb-20 sm:pb-4">
                    <Button
                        color="danger"
                        variant="flat"
                        fullWidth
                        startContent={<LogOut className="h-4 w-4" />}
                        onPress={() => clerk.signOut({ redirectUrl: "/" })}
                    >
                        Sign Out
                    </Button>
                </div>

            </div>
        </div>
    );
}
