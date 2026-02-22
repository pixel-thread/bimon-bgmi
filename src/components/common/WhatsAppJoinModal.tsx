"use client";

import { useState, useEffect } from "react";
import { Button } from "@heroui/react";
import { motion, AnimatePresence } from "motion/react";
import { MessageCircle, ChevronRight, Check, X } from "lucide-react";

const WHATSAPP_GROUPS = [
    {
        id: "group1",
        name: "Group 1",
        link: "https://chat.whatsapp.com/DV9xBTjp7Q30VU1ITzFpMM",
    },
    {
        id: "group2",
        name: "Group 2",
        link: "https://chat.whatsapp.com/CNuujmMWQNpCdKGze69k0j",
    },
] as const;

interface WhatsAppJoinModalProps {
    /** Whether the modal is open */
    isOpen: boolean;
    /** Called when user dismisses (only allowed after joining all groups) */
    onClose: () => void;
    /** Whether this is mandatory (hides close until all joined) */
    mandatory?: boolean;
}

/**
 * WhatsApp group join modal — shows after onboarding.
 * Mandatory: user must join both groups before proceeding.
 * Tracks joined groups in localStorage.
 */
export function WhatsAppJoinModal({
    isOpen,
    onClose,
    mandatory = true,
}: WhatsAppJoinModalProps) {
    const [joinedGroups, setJoinedGroups] = useState<Set<string>>(new Set());
    const [isHydrated, setIsHydrated] = useState(false);

    // Load from localStorage
    useEffect(() => {
        const stored = localStorage.getItem("whatsapp_joined_groups");
        if (stored) {
            try {
                setJoinedGroups(new Set(JSON.parse(stored)));
            } catch {
                // ignore
            }
        }
        setIsHydrated(true);
    }, []);

    const handleJoin = (groupId: string, link: string) => {
        window.open(link, "_blank", "noopener,noreferrer");
        const updated = new Set(joinedGroups);
        updated.add(groupId);
        setJoinedGroups(updated);
        localStorage.setItem("whatsapp_joined_groups", JSON.stringify([...updated]));
    };

    if (!isHydrated) return null;

    const allJoined = WHATSAPP_GROUPS.every((g) => joinedGroups.has(g.id));
    const canClose = !mandatory || allJoined;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={canClose ? onClose : undefined}
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="relative bg-background border border-divider rounded-2xl shadow-2xl mx-4 max-w-sm w-full overflow-hidden"
                    >
                        {/* Header */}
                        <div className="bg-success/10 px-6 pt-6 pb-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-success rounded-full flex items-center justify-center">
                                        <MessageCircle className="w-5 h-5 text-white" />
                                    </div>
                                    <h2 className="text-lg font-bold">
                                        Join WhatsApp
                                    </h2>
                                </div>
                                {canClose && (
                                    <button
                                        onClick={onClose}
                                        className="text-foreground/40 hover:text-foreground transition-colors"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                )}
                            </div>
                            <p className="text-sm text-foreground/50 mt-2">
                                Join our WhatsApp groups to get{" "}
                                <span className="text-danger font-semibold">
                                    Room ID, passwords
                                </span>
                                , and important updates.
                            </p>
                        </div>

                        {/* Groups */}
                        <div className="px-6 py-4 space-y-3">
                            {WHATSAPP_GROUPS.map((group) => {
                                const isJoined = joinedGroups.has(group.id);
                                return (
                                    <button
                                        key={group.id}
                                        onClick={() =>
                                            !isJoined &&
                                            handleJoin(group.id, group.link)
                                        }
                                        disabled={isJoined}
                                        className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${isJoined
                                                ? "bg-success/10 border border-success/30"
                                                : "bg-default-100 hover:bg-success/10 active:scale-[0.98]"
                                            }`}
                                    >
                                        <div
                                            className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isJoined
                                                    ? "bg-success"
                                                    : "bg-success/80"
                                                }`}
                                        >
                                            {isJoined ? (
                                                <Check className="w-5 h-5 text-white" />
                                            ) : (
                                                <MessageCircle className="w-5 h-5 text-white" />
                                            )}
                                        </div>
                                        <div className="text-left flex-1">
                                            <p className="font-semibold text-sm">
                                                {group.name}
                                            </p>
                                            <p className="text-xs text-foreground/40">
                                                {isJoined
                                                    ? "Joined ✓"
                                                    : "Tap to join"}
                                            </p>
                                        </div>
                                        {!isJoined && (
                                            <ChevronRight className="w-4 h-4 text-success" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Footer */}
                        <div className="px-6 pb-5">
                            {allJoined ? (
                                <Button
                                    color="primary"
                                    className="w-full"
                                    onPress={onClose}
                                >
                                    Continue to Tournament
                                </Button>
                            ) : (
                                <p className="text-xs text-center text-foreground/30">
                                    Join both groups to continue
                                </p>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
