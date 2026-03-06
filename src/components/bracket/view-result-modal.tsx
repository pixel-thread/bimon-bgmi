"use client";

import {
    Modal, ModalContent, ModalHeader, ModalBody,
    Chip, Avatar,
} from "@heroui/react";
import { Trophy, Camera, User } from "lucide-react";

interface ViewResultModalProps {
    isOpen: boolean;
    onClose: () => void;
    match: {
        id: string;
        player1?: string | null;
        player2?: string | null;
        player1Avatar?: string | null;
        player2Avatar?: string | null;
        score1?: number | null;
        score2?: number | null;
        winnerId?: string | null;
        player1Id?: string | null;
        player2Id?: string | null;
        status: string;
        screenshotUrl?: string | null;
    } | null;
}

export function ViewResultModal({ isOpen, onClose, match }: ViewResultModalProps) {
    if (!match) return null;

    const p1Won = match.winnerId === match.player1Id;
    const p2Won = match.winnerId === match.player2Id;

    return (
        <Modal isOpen={isOpen} onClose={onClose} placement="center" size="lg">
            <ModalContent>
                <ModalHeader className="flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-primary" />
                    Match Result
                </ModalHeader>
                <ModalBody className="pb-6 space-y-4">
                    {/* Score display */}
                    <div className="flex items-center justify-center gap-4 py-4">
                        {/* Player 1 */}
                        <div className={`flex flex-col items-center gap-2 flex-1 ${p1Won ? "" : "opacity-50"}`}>
                            <Avatar
                                src={match.player1Avatar || undefined}
                                name={match.player1?.[0] || "?"}
                                size="lg"
                                className={p1Won ? "ring-2 ring-success" : ""}
                            />
                            <span className="text-sm font-medium truncate max-w-[120px]">
                                {match.player1 || "TBD"}
                            </span>
                            {p1Won && (
                                <Chip size="sm" color="success" variant="flat" startContent={<Trophy className="h-3 w-3" />}>
                                    Winner
                                </Chip>
                            )}
                        </div>

                        {/* Score */}
                        <div className="flex items-center gap-3">
                            <span className={`text-4xl font-black ${p1Won ? "text-success" : "text-foreground/40"}`}>
                                {match.score1 ?? "-"}
                            </span>
                            <span className="text-foreground/20 font-bold text-xl">—</span>
                            <span className={`text-4xl font-black ${p2Won ? "text-success" : "text-foreground/40"}`}>
                                {match.score2 ?? "-"}
                            </span>
                        </div>

                        {/* Player 2 */}
                        <div className={`flex flex-col items-center gap-2 flex-1 ${p2Won ? "" : "opacity-50"}`}>
                            <Avatar
                                src={match.player2Avatar || undefined}
                                name={match.player2?.[0] || "?"}
                                size="lg"
                                className={p2Won ? "ring-2 ring-success" : ""}
                            />
                            <span className="text-sm font-medium truncate max-w-[120px]">
                                {match.player2 || "TBD"}
                            </span>
                            {p2Won && (
                                <Chip size="sm" color="success" variant="flat" startContent={<Trophy className="h-3 w-3" />}>
                                    Winner
                                </Chip>
                            )}
                        </div>
                    </div>

                    {/* Status */}
                    <div className="flex justify-center">
                        <Chip
                            size="sm"
                            variant="flat"
                            color={match.status === "CONFIRMED" ? "success" : match.status === "SUBMITTED" ? "warning" : "default"}
                        >
                            {match.status === "CONFIRMED" ? "✅ Confirmed" :
                                match.status === "SUBMITTED" ? "⏰ Awaiting Confirmation" :
                                    match.status}
                        </Chip>
                    </div>

                    {/* Screenshot proof */}
                    {match.screenshotUrl ? (
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-foreground/50 flex items-center gap-1.5">
                                <Camera className="h-3 w-3" />
                                Screenshot Proof
                            </label>
                            <div className="rounded-xl overflow-hidden border border-divider">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={match.screenshotUrl}
                                    alt="Match result screenshot"
                                    className="w-full max-h-64 object-contain bg-black/50"
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center gap-2 py-3 rounded-xl bg-foreground/5 border border-divider">
                            <Camera className="h-4 w-4 text-foreground/30" />
                            <span className="text-xs text-foreground/40">No screenshot uploaded</span>
                        </div>
                    )}
                </ModalBody>
            </ModalContent>
        </Modal>
    );
}
