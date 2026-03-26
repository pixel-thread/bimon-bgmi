"use client";

import { useState, useEffect } from "react";
import {
    Modal, ModalContent, ModalHeader, ModalBody, ModalFooter,
    Avatar, Button, Chip,
} from "@heroui/react";
import { Trophy, ShieldAlert, CheckCircle2, Camera, X, Maximize2 } from "lucide-react";
import type { BracketMatchData, RoundData } from "./bracket-shared";

/**
 * Auto-popup, non-dismissable modal shown when a player visits /bracket
 * and has a SUBMITTED match awaiting their confirmation.
 *
 * Shows the opponent's submitted score + screenshot and offers:
 * - ✅ Confirm result
 * - ⚠️ Raise dispute (opens submit modal in dispute mode)
 */

interface PendingConfirmationModalProps {
    match: BracketMatchData | null;
    rounds: RoundData[];
    currentPlayerId: string;
    onConfirm: (matchId: string) => void;
    onDispute: (matchId: string) => void;
    isConfirming?: boolean;
    isConfirmSuccess?: boolean;
}

export function PendingConfirmationModal({
    match,
    rounds,
    currentPlayerId,
    onConfirm,
    onDispute,
    isConfirming,
    isConfirmSuccess,
}: PendingConfirmationModalProps) {
    const [dismissed, setDismissed] = useState<string | null>(null);
    const [lightbox, setLightbox] = useState(false);

    // Auto-dismiss after successful confirmation
    useEffect(() => {
        if (isConfirmSuccess && match) {
            setDismissed(match.id);
        }
    }, [isConfirmSuccess, match]);

    if (!match) return null;
    if (dismissed === match.id) return null;

    const screenshotUrl = match.results?.[0]?.screenshotUrl ?? null;
    const notes = match.results?.[0]?.notes ?? null;

    const isP1 = currentPlayerId === match.player1Id;
    const myPlayer = isP1 ? match.player1 : match.player2;
    const myAvatar = isP1 ? match.player1Avatar : match.player2Avatar;
    const myScore = isP1 ? match.score1 : match.score2;

    const oppPlayer = isP1 ? match.player2 : match.player1;
    const oppAvatar = isP1 ? match.player2Avatar : match.player1Avatar;
    const oppScore = isP1 ? match.score2 : match.score1;

    const iWon = match.winnerId === currentPlayerId;
    const oppWon = match.winnerId !== currentPlayerId && match.winnerId !== null;

    return (
        <>
            <Modal
                isOpen={true}
                isDismissable={false}
                hideCloseButton={true}
                placement="center"
                size="sm"
            >
                <ModalContent>
                    <ModalHeader className="flex flex-col items-center gap-1 pb-0">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-warning/30 to-warning/10 border border-warning/20">
                            <ShieldAlert className="h-5 w-5 text-warning" />
                        </div>
                        <span className="text-base font-semibold">
                            Confirm Match Result
                        </span>
                        <span className="text-[11px] text-foreground/40">
                            Your opponent submitted a result — please review
                        </span>
                    </ModalHeader>

                    <ModalBody className="gap-4">
                        {/* Scoreboard */}
                        <div className="relative rounded-2xl border border-divider overflow-hidden bg-default-50">
                            <div className="flex items-center">
                                {/* My side */}
                                <div className="flex flex-col items-center gap-1.5 flex-1 min-w-0 px-3 py-3">
                                    <Avatar src={myAvatar || undefined} name={myPlayer?.displayName?.[0] || "?"} size="md" />
                                    <span className="text-[10px] font-semibold truncate w-full text-center">
                                        {myPlayer?.displayName || "You"}
                                        <span className="text-primary text-[9px] ml-0.5">(You)</span>
                                    </span>
                                </div>

                                {/* Score */}
                                <div className="flex items-center gap-1.5 shrink-0 px-2">
                                    <span className={`text-4xl font-black tabular-nums leading-none ${iWon ? "text-success" : "text-foreground/50"}`}>
                                        {myScore ?? "—"}
                                    </span>
                                    <span className="text-foreground/15 font-bold text-xl">:</span>
                                    <span className={`text-4xl font-black tabular-nums leading-none ${oppWon ? "text-success" : "text-foreground/50"}`}>
                                        {oppScore ?? "—"}
                                    </span>
                                </div>

                                {/* Opponent side */}
                                <div className="flex flex-col items-center gap-1.5 flex-1 min-w-0 px-3 py-3">
                                    <Avatar src={oppAvatar || undefined} name={oppPlayer?.displayName?.[0] || "?"} size="md" />
                                    <span className="text-[10px] font-semibold truncate w-full text-center">
                                        {oppPlayer?.displayName || "Opponent"}
                                    </span>
                                </div>
                            </div>

                            {/* Winner indicator */}
                            {match.winnerId && (
                                <div className="flex items-center justify-center gap-1.5 py-1.5 bg-success/10 border-t border-success/20">
                                    <Trophy className="h-3 w-3 text-success" />
                                    <span className="text-[10px] font-bold text-success">
                                        {iWon ? "You win!" : `${oppPlayer?.displayName || "Opponent"} wins`}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Screenshot */}
                        {screenshotUrl ? (
                            <div>
                                <p className="text-[10px] font-medium text-foreground/40 mb-1.5">Submitted Screenshot</p>
                                <div
                                    className="relative rounded-xl overflow-hidden border border-divider cursor-zoom-in group bg-default-100"
                                    onClick={() => setLightbox(true)}
                                >
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={screenshotUrl}
                                        alt="Match result"
                                        className="w-full max-h-48 object-contain"
                                    />
                                    <div className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Maximize2 className="h-3 w-3" />
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-divider">
                                <Camera className="h-4 w-4 text-foreground/20" />
                                <span className="text-[11px] text-foreground/30">No screenshot attached</span>
                            </div>
                        )}

                        {/* Notes */}
                        {notes && (
                            <div className="rounded-lg bg-default-50 border border-divider px-3 py-2">
                                <p className="text-[10px] text-foreground/50">{notes}</p>
                            </div>
                        )}

                        {/* Helper text */}
                        <p className="text-[10px] text-center text-foreground/30">
                            If the score is correct, tap <strong>Confirm</strong>. If you disagree, tap <strong>Dispute</strong> to submit your own score and screenshot.
                        </p>
                    </ModalBody>

                    <ModalFooter className="gap-2 pt-0">
                        <Button
                            color="danger"
                            variant="flat"
                            className="flex-1 font-semibold"
                            size="md"
                            startContent={<ShieldAlert className="h-4 w-4" />}
                            isDisabled={isConfirming}
                            onPress={() => {
                                setDismissed(match.id);
                                onDispute(match.id);
                            }}
                        >
                            Dispute
                        </Button>
                        <Button
                            color="success"
                            className="flex-1 font-semibold text-white"
                            size="md"
                            startContent={<CheckCircle2 className="h-4 w-4" />}
                            isLoading={isConfirming}
                            onPress={() => onConfirm(match.id)}
                        >
                            Confirm
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* Lightbox for screenshot */}
            {lightbox && screenshotUrl && (
                <div
                    className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center p-4"
                    onClick={() => setLightbox(false)}
                >
                    <button
                        className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                        onClick={() => setLightbox(false)}
                    >
                        <X className="h-5 w-5" />
                    </button>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={screenshotUrl}
                        alt="Match result full"
                        className="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
                        onClick={e => e.stopPropagation()}
                    />
                </div>
            )}
        </>
    );
}
