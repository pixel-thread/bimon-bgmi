"use client";

import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
    Card,
    CardBody,
    Avatar,
    Chip,
    Skeleton,
    Button,
} from "@heroui/react";
import {
    Target,
    Swords,
    Gamepad2,
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
    TrendingUp,
    TrendingDown,
    Minus,
    ChevronDown,
    Medal,
    Star,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { CategoryBadge } from "@/components/ui/category-badge";
import { useClerk } from "@clerk/nextjs";
import { GameNameInput, validateDisplayName } from "@/components/common/GameNameInput";
import { useIGNTutorial } from "@/components/common/IGNTutorialModal";
import { toast } from "sonner";

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
            matches: number;
            kd: number;
            kdTrend: "up" | "down" | "same";
            kdChange: number;
            lastMatchKills: number;
            seasonsPlayed: number;
            totalTournaments: number;
            bestMatchKills: number;
            wins: number;
            top10: number;
            winRate: number;
            top10Rate: number;
            avgKillsPerMatch: number;
            ucPlacements: {
                first: number;
                second: number;
                third: number;
                fourth: number;
                fifth: number;
            };
        } | null;
        wallet: { balance: number };
        streak: { current: number; longest: number } | null;
    } | null;
}

/**
 * /profile — User's profile page.
 * Shows character hero, detailed stats with K/D trend, UC placements,
 * performance metrics, profile settings, and streak info.
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
    const [showUCBreakdown, setShowUCBreakdown] = useState(false);

    // Profile edit state
    const [editing, setEditing] = useState(false);
    const [newIGN, setNewIGN] = useState("");
    const [newBio, setNewBio] = useState("");
    const [ignError, setIgnError] = useState("");
    const [saving, setSaving] = useState(false);
    const ignTutorial = useIGNTutorial();

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

    const handleSaveProfile = async () => {
        if (newIGN.trim()) {
            const err = validateDisplayName(newIGN);
            if (err) { setIgnError(err); return; }
        }
        setSaving(true);
        try {
            const res = await fetch("/api/profile/update-ign", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...(newIGN.trim() ? { displayName: newIGN.trim() } : {}),
                    ...(newBio !== undefined ? { bio: newBio.trim() } : {}),
                }),
            });
            if (res.ok) {
                toast.success("Profile updated!");
                setEditing(false);
                queryClient.invalidateQueries({ queryKey: ["profile"] });
                queryClient.invalidateQueries({ queryKey: ["auth-user"] });
            } else {
                const json = await res.json();
                setIgnError(json.message || "Failed to update");
            }
        } catch {
            toast.error("Network error");
        } finally {
            setSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="mx-auto max-w-lg px-4 py-6 sm:px-6">
                <div className="space-y-4">
                    <Skeleton className="h-80 w-full rounded-xl" />
                    <div className="grid grid-cols-4 gap-3">
                        {[1, 2, 3, 4].map((i) => (
                            <Skeleton key={i} className="h-16 rounded-xl" />
                        ))}
                    </div>
                    <Skeleton className="h-24 rounded-xl" />
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
                    <div className="relative h-80 w-full group">
                        {(previewCharacter?.url || player?.characterImage?.url) ? (
                            (previewCharacter?.isVideo || (!previewCharacter && player?.characterImage?.isVideo)) ? (
                                <video
                                    src={previewCharacter?.url || player?.characterImage?.url}
                                    autoPlay muted playsInline
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

                        {/* Character upload */}
                        <input
                            ref={characterInputRef}
                            type="file" accept="image/*,video/*" className="hidden"
                            onChange={async (e) => {
                                const file = e.target.files?.[0]; if (!file) return;
                                setUploadingCharacter(true);
                                try {
                                    const fd = new FormData(); fd.append("image", file);
                                    const res = await fetch("/api/profile/upload-character-image", { method: "POST", body: fd });
                                    if (res.ok) {
                                        setPreviewCharacter({ url: URL.createObjectURL(file), isVideo: file.type.startsWith("video/") });
                                        queryClient.invalidateQueries({ queryKey: ["profile"] });
                                    }
                                } finally { setUploadingCharacter(false); e.target.value = ""; }
                            }}
                        />
                        <button
                            onClick={() => characterInputRef.current?.click()}
                            disabled={uploadingCharacter}
                            className="absolute right-3 top-3 flex items-center gap-1.5 rounded-full bg-black/50 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm hover:bg-black/70 disabled:opacity-50"
                        >
                            {uploadingCharacter ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImagePlus className="h-3.5 w-3.5" />}
                            {uploadingCharacter ? "Uploading..." : "Change"}
                        </button>

                        {/* Profile info overlay */}
                        <div className="absolute bottom-3 left-4 right-4 flex items-end gap-3">
                            <div className="relative">
                                <Avatar
                                    src={previewProfileUrl || profile.imageUrl || undefined}
                                    name={name} className="h-16 w-16 ring-2 ring-background"
                                />
                                <input
                                    ref={profileInputRef} type="file" accept="image/*" className="hidden"
                                    onChange={async (e) => {
                                        const file = e.target.files?.[0]; if (!file) return;
                                        setUploadingProfile(true);
                                        try {
                                            const fd = new FormData(); fd.append("image", file);
                                            const res = await fetch("/api/profile/upload-profile-image", { method: "POST", body: fd });
                                            if (res.ok) {
                                                setPreviewProfileUrl(URL.createObjectURL(file));
                                                queryClient.invalidateQueries({ queryKey: ["profile"] });
                                            }
                                        } finally { setUploadingProfile(false); e.target.value = ""; }
                                    }}
                                />
                                <button
                                    onClick={() => profileInputRef.current?.click()}
                                    disabled={uploadingProfile}
                                    className="absolute -bottom-0.5 -right-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white shadow-sm hover:scale-110 disabled:opacity-50"
                                >
                                    {uploadingProfile ? <Loader2 className="h-3 w-3 animate-spin" /> : <Camera className="h-3 w-3" />}
                                </button>
                            </div>
                            <div className="pb-0.5">
                                <div className="flex items-center gap-2">
                                    <h1 className="text-2xl font-bold text-white drop-shadow truncate">{name}</h1>
                                    {player?.hasRoyalPass && <Crown className="h-5 w-5 text-yellow-400 shrink-0" />}
                                </div>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                    <span className="text-sm text-white/50">@{profile.username}</span>
                                    {player && <CategoryBadge category={player.category} size="sm" />}
                                    {profile.role !== "PLAYER" && (
                                        <Chip size="sm" variant="flat" color="primary" startContent={<Shield className="h-3 w-3" />}>
                                            {profile.role}
                                        </Chip>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Banned badge */}
                        {player?.isBanned && (
                            <div className="absolute top-3 left-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-danger/90 text-white text-xs font-medium">
                                <AlertCircle className="h-3 w-3" /> Banned
                            </div>
                        )}
                    </div>
                </Card>

                {/* No player */}
                {!player && (
                    <div className="flex flex-col items-center gap-3 rounded-xl bg-default-100 py-8 text-center">
                        <User className="h-10 w-10 text-foreground/20" />
                        <p className="text-sm text-foreground/50">
                            You don&apos;t have a player profile yet.
                        </p>
                    </div>
                )}

                {/* ── Stats Section ── */}
                {stats && (
                    <Card className="border border-divider overflow-hidden">
                        <CardBody className="p-4 space-y-4">
                            {/* K/D Featured */}
                            <div className="text-center">
                                <div className="flex items-center justify-center gap-2 mb-1">
                                    <p className="text-xs text-foreground/50 font-medium uppercase tracking-wide">K/D Ratio</p>
                                    <CategoryBadge category={player!.category} size="sm" />
                                </div>
                                <div className="flex items-baseline justify-center gap-2">
                                    <span className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                                        {stats.kd.toFixed(2)}
                                    </span>
                                    {stats.matches > 0 && (
                                        <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-sm font-medium ${stats.kdTrend === "up" ? "bg-success/10 text-success" :
                                            stats.kdTrend === "down" ? "bg-danger/10 text-danger" :
                                                "bg-default-100 text-foreground/50"
                                            }`}>
                                            {stats.kdTrend === "up" && <TrendingUp className="w-3.5 h-3.5" />}
                                            {stats.kdTrend === "down" && <TrendingDown className="w-3.5 h-3.5" />}
                                            {stats.kdTrend === "same" && <Minus className="w-3.5 h-3.5" />}
                                            {stats.kdChange > 0 ? "+" : ""}{stats.kdChange.toFixed(2)}
                                        </div>
                                    )}
                                </div>
                                {stats.lastMatchKills > 0 && (
                                    <p className="text-xs text-foreground/40 mt-1">
                                        Last match: <span className="font-semibold text-foreground/70">{stats.lastMatchKills} kills</span>
                                    </p>
                                )}
                            </div>

                            {/* Battle Stats */}
                            <div>
                                <p className="text-[10px] font-semibold text-foreground/40 uppercase tracking-wider mb-2">Battle Stats</p>
                                <div className="grid grid-cols-4 gap-3 text-center">
                                    <div>
                                        <div className="text-2xl font-bold">{stats.matches}</div>
                                        <p className="text-[10px] text-foreground/40 uppercase">Matches</p>
                                    </div>
                                    <div
                                        className="cursor-pointer hover:bg-default-100 rounded-lg py-1 transition-colors"
                                        onClick={() => setShowUCBreakdown(!showUCBreakdown)}
                                    >
                                        <div className="text-2xl font-bold text-success">{stats.wins}</div>
                                        <p className="text-[10px] text-foreground/40 uppercase flex items-center justify-center gap-0.5">
                                            Wins <ChevronDown className={`w-3 h-3 transition-transform ${showUCBreakdown ? "rotate-180" : ""}`} />
                                        </p>
                                    </div>
                                    <div>
                                        <div className="text-2xl font-bold text-primary">{stats.top10}</div>
                                        <p className="text-[10px] text-foreground/40 uppercase">Top 10</p>
                                    </div>
                                    <div>
                                        <div className="text-2xl font-bold text-danger">{stats.kills}</div>
                                        <p className="text-[10px] text-foreground/40 uppercase">Kills</p>
                                    </div>
                                </div>

                                {/* UC Wins Breakdown */}
                                <AnimatePresence>
                                    {showUCBreakdown && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="overflow-hidden"
                                        >
                                            <div className="mt-3 pt-3 border-t border-divider">
                                                {(stats.ucPlacements.first + stats.ucPlacements.second + stats.ucPlacements.third + stats.ucPlacements.fourth + stats.ucPlacements.fifth) === 0 ? (
                                                    <p className="text-center text-sm text-foreground/40 py-2">No UC wins yet</p>
                                                ) : (
                                                    <div className="flex gap-4 justify-center flex-wrap">
                                                        {stats.ucPlacements.first > 0 && (
                                                            <div className="text-center">
                                                                <div className="text-lg font-bold text-yellow-500">🥇{stats.ucPlacements.first}</div>
                                                                <p className="text-[9px] text-foreground/40 uppercase">1st</p>
                                                            </div>
                                                        )}
                                                        {stats.ucPlacements.second > 0 && (
                                                            <div className="text-center">
                                                                <div className="text-lg font-bold text-foreground/50">🥈{stats.ucPlacements.second}</div>
                                                                <p className="text-[9px] text-foreground/40 uppercase">2nd</p>
                                                            </div>
                                                        )}
                                                        {stats.ucPlacements.third > 0 && (
                                                            <div className="text-center">
                                                                <div className="text-lg font-bold text-orange-400">🥉{stats.ucPlacements.third}</div>
                                                                <p className="text-[9px] text-foreground/40 uppercase">3rd</p>
                                                            </div>
                                                        )}
                                                        {stats.ucPlacements.fourth > 0 && (
                                                            <div className="text-center">
                                                                <div className="text-lg font-bold text-foreground/40">{stats.ucPlacements.fourth}</div>
                                                                <p className="text-[9px] text-foreground/40 uppercase">4th</p>
                                                            </div>
                                                        )}
                                                        {stats.ucPlacements.fifth > 0 && (
                                                            <div className="text-center">
                                                                <div className="text-lg font-bold text-foreground/40">{stats.ucPlacements.fifth}</div>
                                                                <p className="text-[9px] text-foreground/40 uppercase">5th</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Performance */}
                            <div className="border-t border-divider pt-3">
                                <p className="text-[10px] font-semibold text-foreground/40 uppercase tracking-wider mb-2">Performance</p>
                                <div className="grid grid-cols-3 gap-3 text-center">
                                    <div>
                                        <div className="text-xl font-bold">{stats.winRate}<span className="text-sm text-foreground/40">%</span></div>
                                        <p className="text-[10px] text-foreground/40 uppercase">Win Rate</p>
                                    </div>
                                    <div>
                                        <div className="text-xl font-bold">{stats.top10Rate}<span className="text-sm text-foreground/40">%</span></div>
                                        <p className="text-[10px] text-foreground/40 uppercase">Top 10 Rate</p>
                                    </div>
                                    <div>
                                        <div className="text-xl font-bold text-warning">{stats.bestMatchKills}</div>
                                        <p className="text-[10px] text-foreground/40 uppercase">Best Kill</p>
                                    </div>
                                </div>
                            </div>

                            {/* Career */}
                            <div className="border-t border-divider pt-3">
                                <p className="text-[10px] font-semibold text-foreground/40 uppercase tracking-wider mb-2">Career</p>
                                <div className="grid grid-cols-3 gap-3 text-center">
                                    <div>
                                        <div className="text-xl font-bold text-secondary">{stats.totalTournaments}</div>
                                        <p className="text-[10px] text-foreground/40 uppercase">Tournaments</p>
                                    </div>
                                    <div>
                                        <div className="text-xl font-bold text-primary">{stats.seasonsPlayed}</div>
                                        <p className="text-[10px] text-foreground/40 uppercase">Seasons</p>
                                    </div>
                                    <div>
                                        <div className="text-xl font-bold">{stats.avgKillsPerMatch}</div>
                                        <p className="text-[10px] text-foreground/40 uppercase">Avg Kills</p>
                                    </div>
                                </div>
                            </div>
                        </CardBody>
                    </Card>
                )}

                {/* Streak */}
                {player?.streak && (player.streak.current > 0 || player.streak.longest > 0) && (
                    <Card className="border border-divider">
                        <CardBody className="p-4">
                            <div className="flex items-center gap-2 mb-3">
                                <Flame className="h-4 w-4 text-warning" />
                                <p className="text-xs font-semibold uppercase tracking-wider text-foreground/50">Streak</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-center">
                                <div>
                                    <div className="text-3xl font-bold text-warning">{player.streak.current}</div>
                                    <p className="text-xs text-foreground/40">Current</p>
                                </div>
                                <div>
                                    <div className="text-3xl font-bold text-foreground/70">{player.streak.longest}</div>
                                    <p className="text-xs text-foreground/40">Longest</p>
                                </div>
                            </div>
                        </CardBody>
                    </Card>
                )}

                {/* Profile Settings Section */}
                {player && (
                    <Card className="border border-divider">
                        <CardBody className="p-4">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <User className="h-4 w-4 text-foreground/50" />
                                    <p className="text-xs font-semibold uppercase tracking-wider text-foreground/50">Profile</p>
                                </div>
                                {!editing && (
                                    <Button
                                        size="sm" variant="light"
                                        onPress={() => {
                                            setEditing(true);
                                            setNewIGN(player.displayName || profile.username);
                                            setNewBio(player.bio || "");
                                            setIgnError("");
                                        }}
                                    >
                                        Edit
                                    </Button>
                                )}
                            </div>

                            {editing ? (
                                <div className="space-y-4">
                                    {/* Username (read-only) */}
                                    <div>
                                        <p className="text-xs text-foreground/40 mb-1">Username</p>
                                        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-default-100">
                                            <span className="text-sm text-foreground/50">@{profile.username}</span>
                                            <Chip size="sm" variant="flat" color="default" className="text-[10px]">Cannot change</Chip>
                                        </div>
                                    </div>

                                    {/* Game Name */}
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <p className="text-xs text-foreground/40">Game Name</p>
                                            {ignTutorial.HelpButton}
                                        </div>
                                        <GameNameInput
                                            value={newIGN}
                                            onChange={setNewIGN}
                                            error={ignError}
                                            onErrorChange={setIgnError}
                                            disabled={saving}
                                        />
                                        <p className="text-[10px] text-foreground/30 mt-1">Leave empty to keep current name</p>
                                    </div>

                                    {/* Bio */}
                                    <div>
                                        <p className="text-xs text-foreground/40 mb-1">Bio</p>
                                        <textarea
                                            value={newBio}
                                            onChange={(e) => setNewBio(e.target.value)}
                                            placeholder="Write something about yourself..."
                                            maxLength={100}
                                            rows={2}
                                            disabled={saving}
                                            className="w-full px-3 py-2 rounded-lg bg-default-100 border border-divider text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
                                        />
                                        <p className="text-[10px] text-foreground/30 mt-0.5 text-right">{newBio.length}/100</p>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-2">
                                        <Button
                                            size="sm" variant="flat"
                                            onPress={() => setEditing(false)}
                                            isDisabled={saving}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            size="sm" color="primary"
                                            onPress={handleSaveProfile}
                                            isLoading={saving}
                                            isDisabled={!!ignError || (newIGN === (player.displayName || profile.username) && newBio === (player.bio || ""))}
                                        >
                                            Save
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-foreground/40">Username:</span>
                                        <span className="text-sm">@{profile.username}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-foreground/40">Game Name:</span>
                                        <span className="text-sm font-bold">{player.displayName || profile.username}</span>
                                    </div>
                                    {player.bio && (
                                        <div className="flex items-start gap-2">
                                            <span className="text-xs text-foreground/40">Bio:</span>
                                            <span className="text-sm italic text-foreground/60">{player.bio}</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </CardBody>
                    </Card>
                )}

                {ignTutorial.Modal}

                {/* Sign Out */}
                <div className="mt-6 pb-20 sm:pb-4">
                    <Button
                        color="danger" variant="flat" fullWidth
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
