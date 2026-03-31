"use client";

import { useState } from "react";
import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    Avatar,
    Chip,
    Spinner,
} from "@heroui/react";
import { Shield, Plus, Users, Crown, Check, Clock, X, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useSquads, useCancelSquad, useRespondToInvite, type SquadDTO } from "@/hooks/use-squads";
import { CreateSquadModal } from "./create-squad-modal";
import { GAME } from "@/lib/game-config";
import { CurrencyIcon } from "@/components/common/CurrencyIcon";

/* ─── Types ─────────────────────────────────────────────────── */

interface SquadCenterProps {
    isOpen: boolean;
    onClose: () => void;
    pollId: string;
    tournamentName: string;
    entryFee: number;
    currentPlayerId: string;
}

/* ─── Status Badge ──────────────────────────────────────────── */

function StatusBadge({ status }: { status: string }) {
    switch (status) {
        case "ACCEPTED":
            return (
                <Chip size="sm" variant="flat" className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" startContent={<Check className="w-3 h-3" />}>
                    Joined
                </Chip>
            );
        case "PENDING":
            return (
                <Chip size="sm" variant="flat" className="bg-amber-500/15 text-amber-600 dark:text-amber-400" startContent={<Clock className="w-3 h-3" />}>
                    Pending
                </Chip>
            );
        case "DECLINED":
            return (
                <Chip size="sm" variant="flat" className="bg-red-500/15 text-red-600 dark:text-red-400" startContent={<X className="w-3 h-3" />}>
                    Declined
                </Chip>
            );
        default:
            return null;
    }
}

/* ─── Squad Card ────────────────────────────────────────────── */

function SquadCard({
    squad,
    currentPlayerId,
    onCancel,
    onAccept,
    onDecline,
    isCancelling,
    isResponding,
}: {
    squad: SquadDTO;
    currentPlayerId: string;
    onCancel: (id: string) => void;
    onAccept: (inviteId: string) => void;
    onDecline: (inviteId: string) => void;
    isCancelling: boolean;
    isResponding: boolean;
}) {
    const isCaptain = squad.captain.id === currentPlayerId;
    const myInvite = squad.myInvite;
    const hasPendingInvite = myInvite?.status === "PENDING";
    const emptySlots = squad.totalSlots - squad.members.length;

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-divider bg-default-50 dark:bg-default-100/50 overflow-hidden"
        >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-divider/50">
                <div className="flex items-center gap-2 min-w-0">
                    <Shield className="w-4 h-4 text-primary shrink-0" />
                    <h4 className="font-semibold text-sm truncate">{squad.name}</h4>
                    {squad.isFull ? (
                        <Chip size="sm" variant="flat" className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 shrink-0">
                            Full ✅
                        </Chip>
                    ) : (
                        <Chip size="sm" variant="flat" className="bg-amber-500/15 text-amber-600 dark:text-amber-400 shrink-0">
                            {squad.acceptedCount}/{squad.totalSlots}
                        </Chip>
                    )}
                </div>
                {isCaptain && squad.status === "FORMING" && (
                    <Button
                        size="sm"
                        variant="light"
                        color="danger"
                        isIconOnly
                        isLoading={isCancelling}
                        onPress={() => onCancel(squad.id)}
                        className="shrink-0"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                )}
            </div>

            {/* Members */}
            <div className="px-4 py-3 space-y-2">
                {squad.members.map((member) => {
                    const isMemberCaptain = member.playerId === squad.captain.id;
                    return (
                        <div key={member.inviteId} className="flex items-center gap-3">
                            <Avatar
                                src={member.imageUrl}
                                name={member.displayName}
                                size="sm"
                                className="w-8 h-8 shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                    <span className="text-sm font-medium truncate">{member.displayName}</span>
                                    {isMemberCaptain && (
                                        <Crown className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                    )}
                                </div>
                            </div>
                            <StatusBadge status={member.status} />
                        </div>
                    );
                })}

                {/* Empty slots */}
                {emptySlots > 0 && Array.from({ length: emptySlots }).map((_, i) => (
                    <div key={`empty-${i}`} className="flex items-center gap-3 opacity-40">
                        <div className="w-8 h-8 rounded-full border-2 border-dashed border-foreground/20 flex items-center justify-center">
                            <Plus className="w-3 h-3" />
                        </div>
                        <span className="text-sm text-foreground/40">Open slot</span>
                    </div>
                ))}
            </div>

            {/* Pending invite action */}
            {hasPendingInvite && myInvite && (
                <div className="px-4 py-3 border-t border-divider/50 bg-primary/5">
                    <p className="text-xs text-foreground/60 mb-2">
                        {squad.captain.displayName} invited you • Entry: {squad.entryFee} <CurrencyIcon size={12} />
                    </p>
                    <div className="flex gap-2">
                        <Button
                            size="sm"
                            color="primary"
                            className="flex-1 font-semibold"
                            isLoading={isResponding}
                            onPress={() => onAccept(myInvite.id)}
                            startContent={!isResponding && <Check className="w-3.5 h-3.5" />}
                        >
                            Accept & Reserve {squad.entryFee} <CurrencyIcon size={12} />
                        </Button>
                        <Button
                            size="sm"
                            variant="flat"
                            color="danger"
                            isLoading={isResponding}
                            onPress={() => onDecline(myInvite.id)}
                            isIconOnly
                        >
                            <X className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            )}
        </motion.div>
    );
}

/* ─── Main Squad Center ─────────────────────────────────────── */

export function SquadCenter({
    isOpen,
    onClose,
    pollId,
    tournamentName,
    entryFee,
    currentPlayerId,
}: SquadCenterProps) {
    const [showCreate, setShowCreate] = useState(false);
    const { data: squads, isLoading, refetch } = useSquads(pollId);
    const cancelMutation = useCancelSquad();
    const respondMutation = useRespondToInvite();

    const mySquad = squads?.find(
        (s) => s.isCaptain || s.myInvite?.status === "ACCEPTED" || s.myInvite?.status === "PENDING"
    );
    const otherSquads = squads?.filter((s) => s.id !== mySquad?.id) ?? [];
    const canCreateSquad = !mySquad;

    function handleCancel(squadId: string) {
        cancelMutation.mutate(squadId);
    }

    function handleAccept(inviteId: string) {
        respondMutation.mutate({ inviteId, action: "ACCEPT" });
    }

    function handleDecline(inviteId: string) {
        respondMutation.mutate({ inviteId, action: "DECLINE" });
    }

    return (
        <>
            <Modal
                isOpen={isOpen}
                onClose={onClose}
                placement="center"
                size="md"
                scrollBehavior="inside"
                classNames={{ body: "px-4 py-3" }}
            >
                <ModalContent>
                    <ModalHeader className="flex items-center gap-2 text-base pb-1">
                        <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center">
                            <Shield className="w-3.5 h-3.5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <span className="truncate block">{tournamentName}</span>
                            <span className="text-xs font-normal text-foreground/50">Squad Center</span>
                        </div>
                    </ModalHeader>

                    <ModalBody>
                        {isLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <Spinner size="lg" />
                            </div>
                        ) : (
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key="squad-list"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="space-y-4"
                                >
                                    {/* Your Squad */}
                                    {mySquad && (
                                        <div>
                                            <p className="text-xs font-semibold text-foreground/50 uppercase tracking-wider mb-2">
                                                Your Squad
                                            </p>
                                            <SquadCard
                                                squad={mySquad}
                                                currentPlayerId={currentPlayerId}
                                                onCancel={handleCancel}
                                                onAccept={handleAccept}
                                                onDecline={handleDecline}
                                                isCancelling={cancelMutation.isPending}
                                                isResponding={respondMutation.isPending}
                                            />
                                        </div>
                                    )}

                                    {/* Other Squads */}
                                    {otherSquads.length > 0 && (
                                        <div>
                                            <p className="text-xs font-semibold text-foreground/50 uppercase tracking-wider mb-2">
                                                {mySquad ? "Other Squads" : "Squads"}
                                            </p>
                                            <div className="space-y-3">
                                                {otherSquads.map((squad) => (
                                                    <SquadCard
                                                        key={squad.id}
                                                        squad={squad}
                                                        currentPlayerId={currentPlayerId}
                                                        onCancel={handleCancel}
                                                        onAccept={handleAccept}
                                                        onDecline={handleDecline}
                                                        isCancelling={cancelMutation.isPending}
                                                        isResponding={respondMutation.isPending}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Empty state */}
                                    {(!squads || squads.length === 0) && (
                                        <div className="flex flex-col items-center gap-3 py-8 text-center">
                                            <div className="w-14 h-14 rounded-full bg-default-100 flex items-center justify-center">
                                                <Users className="w-6 h-6 text-foreground/25" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-foreground/60">No squads yet</p>
                                                <p className="text-sm text-foreground/40">
                                                    Be the first to create a squad!
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            </AnimatePresence>
                        )}
                    </ModalBody>

                    <ModalFooter className="flex-col gap-2">
                        {canCreateSquad && (
                            <Button
                                color="primary"
                                className="w-full font-semibold"
                                startContent={<Plus className="w-4 h-4" />}
                                onPress={() => setShowCreate(true)}
                            >
                                Create New Squad
                            </Button>
                        )}
                        <Button variant="flat" className="w-full" onPress={onClose}>
                            Close
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* Create Squad Modal */}
            <CreateSquadModal
                isOpen={showCreate}
                onClose={() => {
                    setShowCreate(false);
                    refetch();
                }}
                pollId={pollId}
                tournamentName={tournamentName}
                entryFee={entryFee}
            />
        </>
    );
}
