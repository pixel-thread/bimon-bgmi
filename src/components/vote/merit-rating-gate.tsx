"use client";

import { useState, useCallback, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Avatar,
    Button,
    Tooltip,
} from "@heroui/react";
import { Star, Shield, Send, HelpCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

/* ─── Types ─────────────────────────────────────────────────── */

interface PendingPlayer {
    id: string;
    displayName: string;
    imageUrl: string;
}

interface PendingMeritData {
    pending: PendingPlayer[];
    tournamentId: string | null;
    tournamentName: string | null;
}

/* ─── Rating Guide ──────────────────────────────────────────── */

const RATING_LABELS: Record<number, { label: string; color: string }> = {
    1: { label: "Poor — toxic / afk", color: "text-danger" },
    2: { label: "Below Avg — not helpful", color: "text-warning" },
    3: { label: "Average — decent teammate", color: "text-foreground/70" },
    4: { label: "Good — solid player", color: "text-primary" },
    5: { label: "Excellent — great teammate!", color: "text-success" },
};

/* ─── Star Rating Input ─────────────────────────────────────── */

function StarRating({
    value,
    onChange,
    disabled,
}: {
    value: number;
    onChange: (v: number) => void;
    disabled?: boolean;
}) {
    const [hover, setHover] = useState(0);
    const [showNoice, setShowNoice] = useState(false);
    const [noiceKey, setNoiceKey] = useState(0);
    const active = hover || value;

    const handleClick = (star: number) => {
        onChange(star);
        if (star === 5) {
            setNoiceKey(Date.now());
            setShowNoice(true);
            setTimeout(() => setShowNoice(false), 1500);
        } else {
            setShowNoice(false);
        }
    };

    return (
        <div className="flex flex-col items-end gap-0.5 relative">
            <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                    <button
                        key={star}
                        type="button"
                        disabled={disabled}
                        onMouseEnter={() => setHover(star)}
                        onMouseLeave={() => setHover(0)}
                        onClick={() => handleClick(star)}
                        className={`transition-all duration-150 ${disabled
                            ? "cursor-not-allowed opacity-40"
                            : "cursor-pointer hover:scale-110 active:scale-95"
                            }`}
                    >
                        <Star
                            className={`h-5 w-5 transition-colors ${star <= active
                                ? "fill-warning text-warning"
                                : "fill-none text-foreground/20"
                                }`}
                        />
                    </button>
                ))}
            </div>
            {/* Active rating label */}
            {active > 0 && (
                <p className={`text-[10px] font-medium ${RATING_LABELS[active]?.color ?? ""}`}>
                    {RATING_LABELS[active]?.label}
                </p>
            )}
            {/* Noice GIF popup on 5-star */}
            <AnimatePresence>
                {showNoice && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.5, y: 5 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.5 }}
                        transition={{ type: "spring", stiffness: 400, damping: 20 }}
                        className="absolute -top-16 -right-2 z-50"
                    >
                        <img
                            src={`/gif/noice-nice.gif?_=${noiceKey}`}
                            alt="Noice!"
                            className="w-16 h-auto rounded-lg shadow-lg ring-2 ring-warning/30"
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

/* ─── Main Component ────────────────────────────────────────── */

/**
 * Merit rating modal overlay.
 * Floats on top of polls (z-index) — polls remain visible behind.
 * All players rated at once with a single submit button.
 */
export function MeritRatingSection() {
    const queryClient = useQueryClient();

    // Ratings state: { playerId: rating }
    const [ratings, setRatings] = useState<Record<string, number>>({});
    // Hide modal immediately after successful submission
    const [submitted, setSubmitted] = useState(false);

    const { data } = useQuery<PendingMeritData>({
        queryKey: ["pending-merit"],
        queryFn: async () => {
            const res = await fetch(`/api/polls/pending-merit?_t=${Date.now()}`);
            if (!res.ok) throw new Error("Failed");
            const json = await res.json();
            return json.data;
        },
        staleTime: 30 * 1000,
    });

    const allPending = data?.pending ?? [];
    const tournamentId = data?.tournamentId;
    const tournamentName = data?.tournamentName;

    // Check if all players have been rated
    const allRated =
        allPending.length > 0 &&
        allPending.every((p) => ratings[p.id] && ratings[p.id] > 0);

    // Submit all ratings at once
    const submitAll = useMutation({
        mutationFn: async () => {
            if (!tournamentId) throw new Error("No tournament");

            // Submit all ratings in parallel
            const promises = allPending.map((p) =>
                fetch("/api/polls/rate-merit", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        toPlayerId: p.id,
                        tournamentId,
                        rating: ratings[p.id] ?? 3,
                    }),
                })
            );

            await Promise.all(promises);
        },
        onSuccess: () => {
            setSubmitted(true);
            setRatings({});
            queryClient.invalidateQueries({ queryKey: ["pending-merit"] });
        },
    });

    const handleRatingChange = useCallback(
        (playerId: string, value: number) => {
            setRatings((prev) => ({ ...prev, [playerId]: value }));
        },
        []
    );

    // Reset submitted flag once the API confirms no pending ratings remain
    // so future tournaments can trigger the modal again
    useEffect(() => {
        if (submitted && allPending.length === 0) {
            setSubmitted(false);
        }
    }, [submitted, allPending.length]);

    // Hide immediately after submit; only re-show if API returns new pending players
    const isOpen = !submitted && allPending.length > 0 && !!tournamentId;

    return (
        <Modal
            isOpen={isOpen}
            hideCloseButton
            isDismissable={false}
            placement="center"
            size="sm"
            backdrop="blur"
            classNames={{
                backdrop: "bg-black/40",
            }}
        >
            <ModalContent>
                {/* Header */}
                <ModalHeader className="flex items-center gap-2 pb-2">
                    <div className="rounded-full bg-warning/15 p-1.5">
                        <Shield className="h-4 w-4 text-warning" />
                    </div>
                    <div className="flex-1">
                        <p className="text-sm font-semibold">Rate Your Teammates</p>
                        <p className="text-[11px] font-normal text-foreground/50">
                            From{" "}
                            <span className="font-medium text-foreground/70">
                                {tournamentName}
                            </span>
                        </p>
                    </div>
                    <Tooltip
                        content={
                            <div className="max-w-[200px] space-y-1 p-1">
                                <p className="text-[11px] font-semibold mb-1.5">How to rate:</p>
                                {Object.entries(RATING_LABELS).map(([k, v]) => (
                                    <div key={k} className="flex items-center gap-1.5 text-[10px]">
                                        <span className="font-bold text-warning">{k}★</span>
                                        <span className={v.color}>{v.label}</span>
                                    </div>
                                ))}
                            </div>
                        }
                        placement="bottom-end"
                    >
                        <button className="rounded-full p-1 hover:bg-foreground/5 transition-colors">
                            <HelpCircle className="h-4 w-4 text-foreground/30" />
                        </button>
                    </Tooltip>
                </ModalHeader>

                {/* Player Rows */}
                <ModalBody className="gap-0 px-0 py-0">
                    <div className="divide-y divide-divider/50">
                        {allPending.map((player, i) => (
                            <motion.div
                                key={player.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className="flex items-center gap-3 px-5 py-3"
                            >
                                <Avatar
                                    src={player.imageUrl}
                                    name={player.displayName}
                                    size="sm"
                                    className="shrink-0 h-8 w-8"
                                />
                                <p className="text-[13px] font-medium truncate flex-1 min-w-0">
                                    {player.displayName}
                                </p>
                                <StarRating
                                    value={ratings[player.id] ?? 0}
                                    onChange={(v) =>
                                        handleRatingChange(player.id, v)
                                    }
                                    disabled={submitAll.isPending}
                                />
                            </motion.div>
                        ))}
                    </div>
                </ModalBody>

                {/* Submit Button */}
                <ModalFooter className="pt-2">
                    <Button
                        fullWidth
                        size="sm"
                        color="warning"
                        variant={allRated ? "solid" : "flat"}
                        isLoading={submitAll.isPending}
                        isDisabled={!allRated}
                        startContent={
                            !submitAll.isPending && (
                                <Send className="h-3.5 w-3.5" />
                            )
                        }
                        onPress={() => submitAll.mutate()}
                        className="font-medium"
                    >
                        {allRated
                            ? "Submit All Ratings"
                            : `Rate all ${allPending.length} players to continue`}
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}
