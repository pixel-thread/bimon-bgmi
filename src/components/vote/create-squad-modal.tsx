"use client";

import { useState, useCallback } from "react";
import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    Input,
    Avatar,
    Chip,
    Spinner,
} from "@heroui/react";
import { Shield, Search, UserPlus, Check, Crown, ChevronLeft, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useCreateSquad, useInvitePlayer, useSquads, useSearchPlayers, type SquadDTO } from "@/hooks/use-squads";
import { GAME } from "@/lib/game-config";
import { CurrencyIcon } from "@/components/common/CurrencyIcon";

/* ─── Types ─────────────────────────────────────────────────── */

interface CreateSquadModalProps {
    isOpen: boolean;
    onClose: () => void;
    pollId: string;
    tournamentName: string;
    entryFee: number;
}

type Step = "name" | "roster";

/* ─── Player Search Panel ───────────────────────────────────── */

function PlayerSearchPanel({
    pollId,
    squadId,
    onInvite,
    isInviting,
    onBack,
}: {
    pollId: string;
    squadId: string;
    onInvite: (playerId: string) => void;
    isInviting: boolean;
    onBack: () => void;
}) {
    const [query, setQuery] = useState("");
    const { data: results, isLoading } = useSearchPlayers(query, pollId);

    return (
        <div className="space-y-3">
            <button
                type="button"
                onClick={onBack}
                className="flex items-center gap-1 text-sm text-primary hover:text-primary/80 transition-colors cursor-pointer"
            >
                <ChevronLeft className="w-4 h-4" />
                Back to roster
            </button>

            <Input
                placeholder="Search by player name..."
                value={query}
                onValueChange={setQuery}
                startContent={<Search className="w-4 h-4 text-foreground/40" />}
                autoFocus
                className="w-full"
                size="sm"
            />

            <div className="space-y-1 max-h-60 overflow-y-auto">
                {isLoading && query.length >= 2 && (
                    <div className="flex justify-center py-4">
                        <Spinner size="sm" />
                    </div>
                )}

                {results?.map((player) => (
                    <motion.div
                        key={player.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-default-100 transition-colors"
                    >
                        <Avatar
                            src={player.imageUrl}
                            name={player.displayName}
                            size="sm"
                            className="w-8 h-8 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{player.displayName}</p>
                            <p className="text-[11px] text-foreground/40">
                                {player.balance} {GAME.currency}
                            </p>
                        </div>
                        <Button
                            size="sm"
                            color={player.hasEnoughBalance ? "primary" : "default"}
                            variant={player.hasEnoughBalance ? "flat" : "light"}
                            isDisabled={!player.hasEnoughBalance || isInviting}
                            isLoading={isInviting}
                            onPress={() => onInvite(player.id)}
                            startContent={
                                player.hasEnoughBalance ? (
                                    <UserPlus className="w-3.5 h-3.5" />
                                ) : (
                                    <AlertCircle className="w-3.5 h-3.5" />
                                )
                            }
                        >
                            {player.hasEnoughBalance ? "Invite" : "Insufficient"}
                        </Button>
                    </motion.div>
                ))}

                {results?.length === 0 && query.length >= 2 && !isLoading && (
                    <p className="text-sm text-foreground/40 text-center py-4">No players found</p>
                )}

                {query.length < 2 && (
                    <p className="text-sm text-foreground/40 text-center py-4">Type at least 2 characters to search</p>
                )}
            </div>
        </div>
    );
}

/* ─── Main Component ────────────────────────────────────────── */

export function CreateSquadModal({
    isOpen,
    onClose,
    pollId,
    tournamentName,
    entryFee,
}: CreateSquadModalProps) {
    const [step, setStep] = useState<Step>("name");
    const [squadName, setSquadName] = useState("");
    const [createdSquadId, setCreatedSquadId] = useState<string | null>(null);
    const [showSearch, setShowSearch] = useState(false);

    const createMutation = useCreateSquad();
    const inviteMutation = useInvitePlayer();
    const { data: squads } = useSquads(pollId);

    // Find the just-created squad to show its roster
    const mySquad = squads?.find((s) => s.id === createdSquadId);

    const slotsNeeded = GAME.squadSize - 1; // captain already in

    const handleCreate = useCallback(async () => {
        if (!squadName.trim()) return;
        createMutation.mutate(
            { pollId, name: squadName.trim() },
            {
                onSuccess: (data) => {
                    setCreatedSquadId(data.data?.id);
                    setStep("roster");
                },
            }
        );
    }, [pollId, squadName, createMutation]);

    const handleInvite = useCallback((playerId: string) => {
        if (!createdSquadId) return;
        inviteMutation.mutate(
            { squadId: createdSquadId, playerId },
            { onSuccess: () => setShowSearch(false) }
        );
    }, [createdSquadId, inviteMutation]);

    const handleClose = useCallback(() => {
        setStep("name");
        setSquadName("");
        setCreatedSquadId(null);
        setShowSearch(false);
        onClose();
    }, [onClose]);

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            placement="center"
            size="md"
            scrollBehavior="inside"
        >
            <ModalContent>
                <ModalHeader className="flex items-center gap-2 text-base pb-1">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                        <Shield className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <span className="truncate block">
                            {step === "name" ? "Create Squad" : showSearch ? "Invite Player" : "Your Roster"}
                        </span>
                        <span className="text-xs font-normal text-foreground/50">{tournamentName}</span>
                    </div>
                </ModalHeader>

                <ModalBody className="px-4 py-3">
                    <AnimatePresence mode="wait">
                        {step === "name" && (
                            <motion.div
                                key="name-step"
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8 }}
                                className="space-y-4"
                            >
                                {/* Entry Fee Info */}
                                <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/5 border border-primary/10">
                                    <CurrencyIcon size={16} />
                                    <div className="text-sm">
                                        <span className="font-medium">{entryFee} {GAME.currency}</span>
                                        <span className="text-foreground/60"> per player • {GAME.squadSize} players</span>
                                    </div>
                                </div>

                                <Input
                                    label="Squad Name"
                                    placeholder="e.g. Team Alpha"
                                    value={squadName}
                                    onValueChange={setSquadName}
                                    maxLength={30}
                                    autoFocus
                                    description={`${squadName.length}/30 characters`}
                                    classNames={{ input: "text-base" }}
                                />

                                <div className="text-xs text-foreground/50 space-y-1">
                                    <p>• Your {entryFee} {GAME.currency} entry fee will be <strong>reserved</strong> (not charged yet)</p>
                                    <p>• Each teammate must also have {entryFee} {GAME.currency} available</p>
                                    <p>• Fees are only charged when admin generates teams</p>
                                </div>
                            </motion.div>
                        )}

                        {step === "roster" && !showSearch && (
                            <motion.div
                                key="roster-step"
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8 }}
                                className="space-y-3"
                            >
                                {/* Roster slots */}
                                {mySquad?.members.map((member) => {
                                    const isCaptain = member.playerId === mySquad.captain.id;
                                    return (
                                        <div
                                            key={member.inviteId}
                                            className="flex items-center gap-3 p-3 rounded-xl bg-default-50 border border-divider/50"
                                        >
                                            <Avatar
                                                src={member.imageUrl}
                                                name={member.displayName}
                                                size="sm"
                                                className="w-9 h-9"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-sm font-semibold truncate">{member.displayName}</span>
                                                    {isCaptain && <Crown className="w-3.5 h-3.5 text-amber-500" />}
                                                </div>
                                                <p className="text-[11px] text-foreground/40">
                                                    {isCaptain ? "Captain" : member.status === "ACCEPTED" ? "Joined" : member.status === "PENDING" ? "Invite sent" : "Declined"}
                                                </p>
                                            </div>
                                            {member.status === "ACCEPTED" && (
                                                <Chip size="sm" variant="flat" className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                                                    <Check className="w-3 h-3" />
                                                </Chip>
                                            )}
                                            {member.status === "PENDING" && (
                                                <Chip size="sm" variant="flat" className="bg-amber-500/15 text-amber-600">
                                                    📩
                                                </Chip>
                                            )}
                                        </div>
                                    );
                                })}

                                {/* Empty invite slots */}
                                {mySquad && Array.from({ length: GAME.squadSize - mySquad.members.length }).map((_, i) => (
                                    <button
                                        key={`slot-${i}`}
                                        type="button"
                                        onClick={() => setShowSearch(true)}
                                        className="w-full flex items-center gap-3 p-3 rounded-xl border-2 border-dashed border-primary/30 hover:border-primary/60 hover:bg-primary/5 transition-all cursor-pointer"
                                    >
                                        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                                            <UserPlus className="w-4 h-4 text-primary" />
                                        </div>
                                        <span className="text-sm font-medium text-primary">+ Invite Player</span>
                                    </button>
                                ))}

                                {!mySquad && (
                                    <div className="flex justify-center py-4">
                                        <Spinner size="sm" />
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {step === "roster" && showSearch && (
                            <motion.div
                                key="search-step"
                                initial={{ opacity: 0, x: 16 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -16 }}
                            >
                                <PlayerSearchPanel
                                    pollId={pollId}
                                    squadId={createdSquadId!}
                                    onInvite={handleInvite}
                                    isInviting={inviteMutation.isPending}
                                    onBack={() => setShowSearch(false)}
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </ModalBody>

                <ModalFooter>
                    {step === "name" ? (
                        <div className="flex gap-2 w-full">
                            <Button variant="flat" className="flex-1" onPress={handleClose}>
                                Cancel
                            </Button>
                            <Button
                                color="primary"
                                className="flex-1 font-semibold"
                                isDisabled={!squadName.trim()}
                                isLoading={createMutation.isPending}
                                onPress={handleCreate}
                                startContent={!createMutation.isPending && <Shield className="w-4 h-4" />}
                            >
                                Create Squad
                            </Button>
                        </div>
                    ) : (
                        <Button
                            color="primary"
                            variant="flat"
                            className="w-full"
                            onPress={handleClose}
                        >
                            {mySquad?.isFull ? "Done — Squad Complete! 🎉" : "Done — Finish Later"}
                        </Button>
                    )}
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}
