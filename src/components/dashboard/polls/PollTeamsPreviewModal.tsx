"use client";

import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    Chip,
    Spinner,
} from "@heroui/react";
import {
    Users,
    Coins,
    RefreshCw,
    CheckCircle2,
    AlertTriangle,
    Loader2,
    Zap,
} from "lucide-react";
import type { PreviewTeamsByPollsResult, TeamPreview } from "@/lib/logic/previewTeamsByPoll";

// ─── Helpers ─────────────────────────────────────────────────

function getKDColor(kd: number): string {
    if (kd >= 1.7) return "text-purple-500";
    if (kd >= 1.5) return "text-blue-500";
    if (kd >= 1.0) return "text-green-500";
    if (kd >= 0.5) return "text-yellow-500";
    return "text-red-500";
}

function getBalanceColor(balance: number, entryFee: number): string {
    if (entryFee === 0) return "text-foreground/50";
    if (balance >= entryFee) return "text-success";
    return "text-danger";
}

function getCategoryColor(category: string): string {
    const colors: Record<string, string> = {
        BOT: "text-red-400",
        ULTRA_NOOB: "text-orange-400",
        NOOB: "text-yellow-400",
        PRO: "text-green-400",
        ULTRA_PRO: "text-blue-400",
        LEGEND: "text-purple-400",
    };
    return colors[category] ?? "text-foreground/50";
}

function getCategoryLabel(category: string): string {
    const labels: Record<string, string> = {
        BOT: "Bot",
        ULTRA_NOOB: "U.Noob",
        NOOB: "Noob",
        PRO: "Pro",
        ULTRA_PRO: "U.Pro",
        LEGEND: "Legend",
    };
    return labels[category] ?? category;
}

function getDisplayName(displayName?: string | null, username?: string): string {
    return displayName || username || "Unknown";
}

// ─── TeamCard ────────────────────────────────────────────────

function TeamCard({ team, entryFee }: { team: TeamPreview; entryFee: number }) {
    return (
        <div className="rounded-lg border border-divider bg-default-50 p-2.5">
            {/* Header */}
            <div className="mb-1.5 flex items-center justify-between">
                <span className="text-xs font-semibold">{team.teamName}</span>
                <div className="flex items-center gap-1">
                    <Chip size="sm" variant="flat" color="primary" className="h-5 px-1 text-[10px]">
                        <Zap className="mr-0.5 inline h-2.5 w-2.5" />
                        {team.weightedScore.toFixed(1)}
                    </Chip>
                    <Chip size="sm" variant="flat" className="h-5 px-1 text-[10px]">
                        {team.players.length}p
                    </Chip>
                </div>
            </div>

            {/* Players */}
            <ul className="space-y-0.5">
                {team.players.map((player) => (
                    <li
                        key={player.id}
                        className="flex items-center justify-between rounded bg-default-100 px-2 py-1.5 text-xs"
                    >
                        <div className="flex min-w-0 max-w-[55%] items-center gap-1">
                            <span className="truncate font-medium">
                                {getDisplayName(player.displayName, player.username)}
                            </span>
                            <span className={`shrink-0 text-[9px] font-medium ${getCategoryColor(player.category)}`}>
                                {getCategoryLabel(player.category)}
                            </span>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                            <span className={`font-mono text-xs ${getKDColor(player.kd)}`}>
                                {player.kd.toFixed(2)}
                            </span>
                            <span className={`font-mono text-xs ${getBalanceColor(player.balance, entryFee)}`}>
                                {player.balance}
                            </span>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
}

// ─── Modal ───────────────────────────────────────────────────

type JobStatus = "idle" | "loading" | "completed" | "failed";

interface PollTeamsPreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    previewData: PreviewTeamsByPollsResult | null;
    isLoading: boolean;
    jobStatus: JobStatus;
    onConfirm: () => void;
    onRegenerate: () => void;
    error?: string | null;
}

export function PollTeamsPreviewModal({
    isOpen,
    onClose,
    previewData,
    isLoading,
    jobStatus,
    onConfirm,
    onRegenerate,
    error,
}: PollTeamsPreviewModalProps) {
    const isConfirming = jobStatus === "loading";

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            size="full"
            scrollBehavior="inside"
            classNames={{
                base: "sm:max-w-4xl sm:max-h-[85vh] sm:m-auto",
                body: "p-3 sm:p-4",
                header: "border-b border-divider p-3 sm:p-4",
                footer: "border-t border-divider p-3 sm:p-4",
            }}
        >
            <ModalContent>
                <ModalHeader className="flex items-center gap-2 text-base">
                    <Users className="h-4 w-4" />
                    Preview Teams
                    <span className="text-xs font-normal text-foreground/50">
                        Review teams. UC debited on confirm.
                    </span>
                </ModalHeader>

                <ModalBody>
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center gap-3 py-12">
                            <Spinner size="lg" />
                            <p className="text-sm text-foreground/50">Generating teams...</p>
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center gap-3 py-12">
                            <AlertTriangle className="h-8 w-8 text-warning" />
                            <p className="text-sm text-foreground/50">{error}</p>
                        </div>
                    ) : previewData ? (
                        <div className="space-y-3">
                            {/* Summary bar */}
                            <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-primary/20 bg-primary/5 p-2.5">
                                <Chip size="sm" variant="flat" className="max-w-[150px] truncate text-xs">
                                    {previewData.tournamentName}
                                </Chip>
                                <Chip size="sm" variant="flat" className="text-xs">
                                    {previewData.teams.length} Teams
                                </Chip>
                                <Chip size="sm" variant="flat" className="text-xs">
                                    {previewData.totalPlayersEligible} Players
                                </Chip>
                                {previewData.entryFee > 0 && (
                                    <Chip size="sm" variant="flat" color="warning" className="text-xs">
                                        {previewData.entryFee} UC
                                    </Chip>
                                )}
                            </div>

                            {/* Solo players info */}
                            {previewData.soloPlayers.length > 0 && (
                                <div className="flex items-start gap-2 rounded-lg border border-primary/20 bg-primary/5 p-2.5">
                                    <Users className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                                    <p className="text-xs leading-relaxed text-primary">
                                        <span className="font-medium">Solo Players: </span>
                                        {previewData.soloPlayers
                                            .slice(0, 5)
                                            .map((p) => p.username)
                                            .join(", ")}
                                        {previewData.soloPlayers.length > 5 &&
                                            ` +${previewData.soloPlayers.length - 5} more`}
                                    </p>
                                </div>
                            )}

                            {/* Insufficient balance warning */}
                            {previewData.playersWithInsufficientBalance.length > 0 && (
                                <div className="flex items-start gap-2 rounded-lg border border-warning/20 bg-warning/5 p-2.5">
                                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
                                    <p className="text-xs leading-relaxed text-warning">
                                        <span className="font-medium">Low balance: </span>
                                        {previewData.playersWithInsufficientBalance
                                            .slice(0, 5)
                                            .map((p) => `${p.username} (${p.balance})`)
                                            .join(", ")}
                                        {previewData.playersWithInsufficientBalance.length > 5 &&
                                            ` +${previewData.playersWithInsufficientBalance.length - 5} more`}
                                    </p>
                                </div>
                            )}

                            {/* Teams grid */}
                            {previewData.teams.length > 0 ? (
                                <div className="grid grid-cols-1 gap-2 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                                    {previewData.teams.map((team) => (
                                        <TeamCard
                                            key={team.teamNumber}
                                            team={team}
                                            entryFee={previewData.entryFee}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <p className="py-8 text-center text-sm text-foreground/50">
                                    No teams generated.
                                </p>
                            )}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center gap-3 py-12">
                            <AlertTriangle className="h-8 w-8 text-warning" />
                            <p className="text-sm text-foreground/50">Failed to load preview.</p>
                        </div>
                    )}
                </ModalBody>

                <ModalFooter className="flex flex-row gap-2">
                    <Button
                        variant="flat"
                        onPress={onClose}
                        isDisabled={isLoading || isConfirming}
                        className="h-10 shrink-0 px-3 text-sm sm:h-9"
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="flat"
                        onPress={onRegenerate}
                        isDisabled={isLoading || isConfirming}
                        color="primary"
                        className="h-10 shrink-0 px-3 text-sm sm:h-9"
                        startContent={<RefreshCw className="h-3.5 w-3.5" />}
                    >
                        <span className="hidden sm:inline">Shuffle</span>
                    </Button>
                    <Button
                        onPress={onConfirm}
                        isDisabled={isLoading || isConfirming || !previewData || jobStatus === "completed"}
                        color={
                            jobStatus === "completed"
                                ? "success"
                                : jobStatus === "failed"
                                    ? "danger"
                                    : "success"
                        }
                        className="min-w-0 flex-1 h-10 sm:h-9 text-sm"
                    >
                        {jobStatus === "completed" ? (
                            <>
                                <CheckCircle2 className="mr-1.5 h-3.5 w-3.5 shrink-0" />
                                <span className="truncate">Created!</span>
                            </>
                        ) : jobStatus === "failed" ? (
                            <>
                                <AlertTriangle className="mr-1.5 h-3.5 w-3.5 shrink-0" />
                                <span className="truncate">Retry</span>
                            </>
                        ) : isConfirming ? (
                            <>
                                <Loader2 className="mr-1.5 h-3.5 w-3.5 shrink-0 animate-spin" />
                                <span className="truncate">Creating...</span>
                            </>
                        ) : (
                            <>
                                <Coins className="mr-1.5 h-3.5 w-3.5 shrink-0" />
                                <span className="truncate">
                                    Confirm ({previewData?.teams.length || 0})
                                </span>
                            </>
                        )}
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}
