"use client";

import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    Avatar,
    Chip,
    Button,
    Input,
    Select,
    SelectItem,
    Skeleton,
    Textarea,
    Switch,
} from "@heroui/react";
import {
    Crown,
    ShieldBan,
    ShieldCheck,
    ShieldAlert,
    BadgeDollarSign,
    Wallet,
    Plus,
    Minus,
    ArrowUpRight,
    ArrowDownRight,
    Clock,
    ChevronDown,
    Link2,
} from "lucide-react";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CategoryBadge } from "@/components/ui/category-badge";
import { GAME } from "@/lib/game-config";

interface PlayerDetailModalProps {
    playerId: string | null;
    isOpen: boolean;
    onClose: () => void;
}

interface PlayerDetail {
    id: string;
    displayName: string | null;
    username: string;
    email: string | null;
    imageUrl: string | null;
    category: string;
    isBanned: boolean;
    hasRoyalPass: boolean;
    isUCExempt: boolean;
    isTrusted: boolean;
    phoneNumber: string | null;
    bio: string | null;
    createdAt: string;
    balance: number;
    stats: { kills: number; matches: number; kd: number };
    streak: { current: number; longest: number };
    ban: { reason: string | null; bannedAt: string | null; duration: number } | null;
}

interface Transaction {
    id: string;
    amount: number;
    type: "CREDIT" | "DEBIT";
    description: string;
    createdAt: string;
}



export function PlayerDetailModal({ playerId, isOpen, onClose }: PlayerDetailModalProps) {
    const queryClient = useQueryClient();
    const [ucAmount, setUcAmount] = useState("");
    const [ucType, setUcType] = useState<"CREDIT" | "DEBIT">("CREDIT");
    const [ucDescription, setUcDescription] = useState("UC Top-up");
    const [banReason, setBanReason] = useState("");
    const [activeTab, setActiveTab] = useState<"overview" | "transactions">("overview");
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
    const toggleSection = (key: string) => setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
    const [linkEmail, setLinkEmail] = useState("");

    // Fetch player details
    const { data: player, isLoading } = useQuery<PlayerDetail>({
        queryKey: ["admin-player", playerId],
        queryFn: async () => {
            const res = await fetch(`/api/players/${playerId}`);
            if (!res.ok) throw new Error("Failed to fetch");
            return res.json();
        },
        enabled: !!playerId && isOpen,
    });

    // Fetch transactions
    const { data: txData, isLoading: txLoading } = useQuery<{ data: Transaction[] }>({
        queryKey: ["admin-player-transactions", playerId],
        queryFn: async () => {
            const res = await fetch(`/api/players/${playerId}/transactions?limit=30`);
            if (!res.ok) throw new Error("Failed to fetch");
            return res.json();
        },
        enabled: !!playerId && isOpen && activeTab === "transactions",
    });

    // UC mutation
    const walletMutation = useMutation({
        mutationFn: async (data: { amount: number; type: string; description: string }) => {
            const res = await fetch(`/api/players/${playerId}/wallet`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error("Failed to update");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-player", playerId] });
            queryClient.invalidateQueries({ queryKey: ["admin-player-transactions", playerId] });
            queryClient.invalidateQueries({ queryKey: ["admin-players"] });
            setUcAmount("");
            setUcDescription("UC Top-up");
        },
    });

    // Ban mutation
    const banMutation = useMutation({
        mutationFn: async (data: { isBanned: boolean; reason?: string }) => {
            const res = await fetch(`/api/players/${playerId}/ban`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error("Failed to update");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-player", playerId] });
            queryClient.invalidateQueries({ queryKey: ["admin-players"] });
            setBanReason("");
        },
    });

    // Toggle mutation (isTrusted / isUCExempt)
    const toggleMutation = useMutation({
        mutationFn: async (data: { isTrusted?: boolean; isUCExempt?: boolean }) => {
            const res = await fetch(`/api/players/${playerId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error("Failed to update");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-player", playerId] });
            queryClient.invalidateQueries({ queryKey: ["admin-players"] });
        },
    });

    // Link/merge player mutation
    const linkMutation = useMutation({
        mutationFn: async (data: { query: string }) => {
            const res = await fetch(`/api/players/${playerId}/link`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.message || json.error || "Failed to link");
            return json;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-player", playerId] });
            queryClient.invalidateQueries({ queryKey: ["admin-players"] });
            setLinkEmail("");
        },
    });

    const handleUcSubmit = () => {
        const amt = parseInt(ucAmount);
        if (!amt || amt <= 0 || !ucDescription.trim()) return;
        walletMutation.mutate({ amount: amt, type: ucType, description: ucDescription.trim() });
    };

    const handleBanToggle = () => {
        if (!player) return;
        banMutation.mutate({
            isBanned: !player.isBanned,
            reason: banReason || undefined,
        });
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            size="2xl"
            scrollBehavior="inside"
            classNames={{
                base: "max-h-[90vh]",
            }}
        >
            <ModalContent>
                <ModalHeader className="flex-col gap-1 pb-0">
                    {isLoading ? (
                        <Skeleton className="h-6 w-48 rounded-lg" />
                    ) : (
                        <div className="flex items-center gap-3">
                            <Avatar
                                src={player?.imageUrl || undefined}
                                name={player?.displayName || player?.username}
                                size="md"
                            />
                            <div>
                                <div className="flex items-center gap-2">
                                    <h2 className="text-lg font-bold">
                                        {player?.displayName || player?.username}
                                    </h2>
                                    {player?.category && <CategoryBadge category={player.category} size="sm" />}
                                </div>
                                <p className="text-xs text-foreground/50">
                                    @{player?.username} · {player?.email}
                                    {player?.phoneNumber && <> · 📞 {player.phoneNumber}</>}
                                </p>
                            </div>
                            {player?.hasRoyalPass && (
                                <Crown className="h-5 w-5 text-yellow-500" />
                            )}
                            {player?.isBanned && (
                                <Chip size="sm" color="danger" variant="flat">
                                    Banned
                                </Chip>
                            )}
                        </div>
                    )}
                </ModalHeader>

                <ModalBody className="gap-4 pb-6">
                    {/* Tab switcher */}
                    <div className="flex gap-1 rounded-lg bg-default-100 p-1">
                        <button
                            onClick={() => setActiveTab("overview")}
                            className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${activeTab === "overview"
                                ? "bg-background shadow-sm"
                                : "text-foreground/50 hover:text-foreground"
                                }`}
                        >
                            Overview & Actions
                        </button>
                        <button
                            onClick={() => setActiveTab("transactions")}
                            className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${activeTab === "transactions"
                                ? "bg-background shadow-sm"
                                : "text-foreground/50 hover:text-foreground"
                                }`}
                        >
                            Transactions
                        </button>
                    </div>

                    {isLoading ? (
                        <div className="space-y-3">
                            <Skeleton className="h-20 w-full rounded-xl" />
                            <Skeleton className="h-32 w-full rounded-xl" />
                        </div>
                    ) : activeTab === "overview" ? (
                        <>
                            {/* UC Credit/Debit form — with balance */}
                            <div className="space-y-3 rounded-xl border border-divider p-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-semibold">Add / Remove {GAME.currency}</h3>
                                    <span className={`text-sm font-bold ${(player?.balance ?? 0) < 0 ? "text-danger" : "text-primary"}`}>
                                        {player?.balance?.toLocaleString()} {GAME.currency}
                                    </span>
                                </div>
                                <div className="flex gap-2">
                                    <Select
                                        size="sm"
                                        selectedKeys={[ucType]}
                                        onSelectionChange={(keys) => {
                                            const val = Array.from(keys)[0] as string;
                                            if (val) setUcType(val as "CREDIT" | "DEBIT");
                                        }}
                                        className="w-32"
                                        aria-label="Transaction type"
                                    >
                                        <SelectItem key="CREDIT">Credit</SelectItem>
                                        <SelectItem key="DEBIT">Debit</SelectItem>
                                    </Select>
                                    <Input
                                        size="sm"
                                        type="number"
                                        placeholder="Amount"
                                        value={ucAmount}
                                        onValueChange={setUcAmount}
                                        startContent={
                                            ucType === "CREDIT" ? (
                                                <Plus className="h-3 w-3 text-success" />
                                            ) : (
                                                <Minus className="h-3 w-3 text-danger" />
                                            )
                                        }
                                        className="flex-1"
                                    />
                                </div>
                                <Textarea
                                    size="sm"
                                    placeholder="Reason (e.g. Tournament prize, penalty...)"
                                    value={ucDescription}
                                    onValueChange={setUcDescription}
                                    minRows={1}
                                    maxRows={2}
                                />
                                <Button
                                    size="sm"
                                    color={ucType === "CREDIT" ? "success" : "danger"}
                                    variant="flat"
                                    onPress={handleUcSubmit}
                                    isLoading={walletMutation.isPending}
                                    isDisabled={!ucAmount || !ucDescription.trim()}
                                    className="w-full"
                                >
                                    {ucType === "CREDIT" ? "Credit" : "Debit"} {ucAmount || "0"} {GAME.currency}
                                </Button>
                                {walletMutation.isSuccess && (
                                    <p className="text-center text-xs text-success">
                                        ✓ Balance updated successfully
                                    </p>
                                )}
                                {walletMutation.isError && (
                                    <p className="text-center text-xs text-danger">
                                        Failed to update balance
                                    </p>
                                )}
                            </div>

                            {/* Player Flags — collapsed by default */}
                            <div className="rounded-xl border border-divider">
                                <button
                                    type="button"
                                    onClick={() => toggleSection("flags")}
                                    className="flex w-full items-center justify-between p-3 text-sm font-semibold cursor-pointer hover:bg-default-50 rounded-xl transition-colors"
                                >
                                    Player Flags
                                    <ChevronDown className={`h-4 w-4 text-foreground/40 transition-transform ${expandedSections.flags ? "rotate-180" : ""}`} />
                                </button>
                                {expandedSections.flags && (
                                    <div className="space-y-3 px-4 pb-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <ShieldAlert className="h-4 w-4 text-primary" />
                                                <div>
                                                    <p className="text-sm font-medium">Trusted Player</p>
                                                    <p className="text-xs text-foreground/50">Extended credit line (-200 {GAME.currency})</p>
                                                </div>
                                            </div>
                                            <Switch
                                                size="sm"
                                                isSelected={player?.isTrusted ?? false}
                                                isDisabled={toggleMutation.isPending}
                                                onValueChange={(val) => toggleMutation.mutate({ isTrusted: val })}
                                                aria-label="Toggle trusted"
                                            />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <BadgeDollarSign className="h-4 w-4 text-warning" />
                                                <div>
                                                    <p className="text-sm font-medium">UC Exempt</p>
                                                    <p className="text-xs text-foreground/50">Skip {GAME.currency} deductions for entry fees</p>
                                                </div>
                                            </div>
                                            <Switch
                                                size="sm"
                                                isSelected={player?.isUCExempt ?? false}
                                                isDisabled={toggleMutation.isPending}
                                                onValueChange={(val) => toggleMutation.mutate({ isUCExempt: val })}
                                                aria-label={`Toggle ${GAME.currency} exempt`}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Ban/Unban — collapsed by default */}
                            <div className="rounded-xl border border-divider">
                                <button
                                    type="button"
                                    onClick={() => toggleSection("ban")}
                                    className="flex w-full items-center justify-between p-3 text-sm font-semibold cursor-pointer hover:bg-default-50 rounded-xl transition-colors"
                                >
                                    {player?.isBanned ? "Player is Banned" : "Ban Player"}
                                    <ChevronDown className={`h-4 w-4 text-foreground/40 transition-transform ${expandedSections.ban ? "rotate-180" : ""}`} />
                                </button>
                                {expandedSections.ban && (
                                    <div className="space-y-3 px-4 pb-4">
                                        {player?.ban && (
                                            <p className="text-xs text-foreground/50">
                                                Reason: {player.ban.reason || "No reason provided"}
                                                {player.ban.bannedAt && (
                                                    <> · {new Date(player.ban.bannedAt).toLocaleDateString()}</>
                                                )}
                                            </p>
                                        )}
                                        {!player?.isBanned && (
                                            <Input
                                                size="sm"
                                                placeholder="Ban reason (optional)"
                                                value={banReason}
                                                onValueChange={setBanReason}
                                            />
                                        )}
                                        <Button
                                            size="sm"
                                            color={player?.isBanned ? "success" : "danger"}
                                            variant="flat"
                                            onPress={handleBanToggle}
                                            isLoading={banMutation.isPending}
                                            startContent={
                                                player?.isBanned ? (
                                                    <ShieldCheck className="h-4 w-4" />
                                                ) : (
                                                    <ShieldBan className="h-4 w-4" />
                                                )
                                            }
                                            className="w-full"
                                        >
                                            {player?.isBanned ? "Unban Player" : "Ban Player"}
                                        </Button>
                                        {banMutation.isSuccess && (
                                            <p className="text-center text-xs text-success">
                                                ✓ Status updated
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Merge Legacy Player — BGMI only (legacy Season 1 players) */}
                            {GAME.gameName === "BGMI" && (
                            <div className="rounded-xl border border-divider">
                                <button
                                    type="button"
                                    onClick={() => toggleSection("link")}
                                    className="flex w-full items-center justify-between p-3 text-sm font-semibold cursor-pointer hover:bg-default-50 rounded-xl transition-colors"
                                >
                                    <span className="flex items-center gap-2">
                                        <Link2 className="h-4 w-4 text-primary" />
                                        Merge Legacy Player
                                    </span>
                                    <ChevronDown className={`h-4 w-4 text-foreground/40 transition-transform ${expandedSections.link ? "rotate-180" : ""}`} />
                                </button>
                                {expandedSections.link && (
                                    <div className="space-y-3 px-4 pb-4">
                                        <p className="text-xs text-foreground/40">
                                            Merge this player&apos;s history into another player&apos;s account. The old data (stats, matches, wallet, transactions) will be combined with the target player&apos;s data.
                                        </p>
                                        <p className="text-[10px] text-foreground/30">
                                            Currently linked to: <span className="font-medium text-foreground/60">{player?.email}</span>
                                        </p>
                                        <Input
                                            size="sm"
                                            type="text"
                                            placeholder="Player name, username, or email"
                                            value={linkEmail}
                                            onValueChange={setLinkEmail}
                                            startContent={<Link2 className="h-3 w-3 text-foreground/30" />}
                                        />
                                        <Button
                                            size="sm"
                                            color="primary"
                                            variant="flat"
                                            className="w-full"
                                            isLoading={linkMutation.isPending}
                                            isDisabled={!linkEmail.trim() || linkEmail.trim() === player?.email}
                                            onPress={() => {
                                                if (confirm(`Merge "${player?.displayName}" into the player on ${linkEmail}?\n\nThis will:\n• Move all stats, matches, wallet balance, and transactions\n• Combine data from both players\n• Delete this old player record\n\nThis cannot be undone.`)) {
                                                    linkMutation.mutate({ query: linkEmail.trim() });
                                                }
                                            }}
                                            startContent={!linkMutation.isPending ? <Link2 className="h-4 w-4" /> : undefined}
                                        >
                                            Merge Player
                                        </Button>
                                        {linkMutation.isSuccess && (
                                            <p className="text-center text-xs text-success">
                                                ✓ {linkMutation.data?.message || "Player linked successfully"}
                                            </p>
                                        )}
                                        {linkMutation.isError && (
                                            <p className="text-center text-xs text-danger">
                                                {(linkMutation.error as Error).message}
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                            )}
                        </>
                    ) : (
                        /* Transactions tab */
                        <div className="space-y-1">
                            {txLoading ? (
                                <div className="space-y-2">
                                    {[1, 2, 3, 4, 5].map((i) => (
                                        <Skeleton key={i} className="h-12 w-full rounded-lg" />
                                    ))}
                                </div>
                            ) : !txData?.data.length ? (
                                <div className="flex flex-col items-center gap-2 py-8 text-center">
                                    <Clock className="h-8 w-8 text-foreground/20" />
                                    <p className="text-sm text-foreground/50">No transactions yet</p>
                                </div>
                            ) : (
                                txData.data.map((tx, i) => {
                                    // Compute balance after this tx by working backwards
                                    // from current balance through all prior transactions
                                    const laterTxs = txData.data.slice(0, i);
                                    let balAfter = player?.balance ?? 0;
                                    for (const lt of laterTxs) {
                                        balAfter -= lt.type === "CREDIT" ? lt.amount : -lt.amount;
                                    }
                                    const balBefore = tx.type === "CREDIT"
                                        ? balAfter - tx.amount
                                        : balAfter + tx.amount;

                                    return (
                                    <div
                                        key={tx.id}
                                        className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-default-100"
                                    >
                                        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${tx.type === "CREDIT"
                                            ? "bg-success/10 text-success"
                                            : "bg-danger/10 text-danger"
                                            }`}>
                                            {tx.type === "CREDIT" ? (
                                                <ArrowDownRight className="h-4 w-4" />
                                            ) : (
                                                <ArrowUpRight className="h-4 w-4" />
                                            )}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm">{tx.description}</p>
                                            <div className="flex items-center gap-1.5 text-xs text-foreground/40">
                                                <span>
                                                    {new Date(tx.createdAt).toLocaleDateString("en-IN", {
                                                        day: "numeric",
                                                        month: "short",
                                                    })}
                                                </span>
                                                <span>·</span>
                                                <span>
                                                    {balBefore.toLocaleString()} → {balAfter.toLocaleString()} {GAME.currency}
                                                </span>
                                            </div>
                                        </div>
                                        <span className={`text-sm font-semibold ${tx.type === "CREDIT" ? "text-success" : "text-danger"
                                            }`}>
                                            {tx.type === "CREDIT" ? "+" : "-"}{tx.amount} {GAME.currency}
                                        </span>
                                    </div>
                                    );
                                })
                            )}
                        </div>
                    )}
                </ModalBody>
            </ModalContent>
        </Modal>
    );
}
