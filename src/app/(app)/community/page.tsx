"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    Card, CardBody, Button, Textarea, Chip, Switch, Avatar,
    Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure,
} from "@heroui/react";
import {
    MessageCircle, Send, Heart, Lightbulb, Bug, Star, HelpCircle,
    ThumbsUp, ThumbsDown, EyeOff, User, Plus,
} from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { GAME } from "@/lib/game-config";

const CATEGORIES = [
    { value: "feedback", label: "Feedback", icon: MessageCircle, color: "primary" as const },
    { value: "suggestion", label: "Suggestion", icon: Lightbulb, color: "warning" as const },
    { value: "bug", label: "Bug Report", icon: Bug, color: "danger" as const },
    { value: "appreciation", label: "Thank You", icon: Heart, color: "success" as const },
    { value: "other", label: "Other", icon: HelpCircle, color: "default" as const },
];

interface MessageDTO {
    id: string;
    message: string;
    category: string;
    isAnonymous: boolean;
    isRead: boolean;
    adminReply: string | null;
    upvotes: number;
    downvotes: number;
    createdAt: string;
    isOwn: boolean;
    myVote: number | null;
    player: { displayName: string; imageUrl: string } | null;
}

const SUBTITLE_MESSAGES = [
    "Send message kumno bin pynbha ia kanoi ka tournament",
    "Pynbeit da n ong bakla lane ai ongmut ia u seng",
];

function RotatingSubtitle() {
    const [index, setIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setIndex((i) => (i + 1) % SUBTITLE_MESSAGES.length);
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    return (
        <AnimatePresence mode="wait">
            <motion.p
                key={index}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.3 }}
                className="text-sm text-foreground/50"
            >
                {SUBTITLE_MESSAGES[index]}
            </motion.p>
        </AnimatePresence>
    );
}

export default function CommunityPage() {
    const queryClient = useQueryClient();
    const composeModal = useDisclosure();
    const [message, setMessage] = useState("");
    const [category, setCategory] = useState("feedback");
    const [isAnonymous, setIsAnonymous] = useState(false);

    // Fetch community feed
    const { data } = useQuery<{ messages: MessageDTO[]; unreadCount: number }>({
        queryKey: ["community-messages"],
        queryFn: async () => {
            const res = await fetch("/api/community");
            if (!res.ok) throw new Error("Failed");
            const json = await res.json();
            return json.data;
        },
    });

    // Submit message
    const submit = useMutation({
        mutationFn: async () => {
            const res = await fetch("/api/community", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message, category, isAnonymous }),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || "Failed");
            return json;
        },
        onSuccess: (data) => {
            toast.success(data.message);
            setMessage("");
            setCategory("feedback");
            setIsAnonymous(false);
            composeModal.onClose();
            queryClient.invalidateQueries({ queryKey: ["community-messages"] });
        },
        onError: (err: Error) => toast.error(err.message),
    });

    // Vote on message
    const voteMutation = useMutation({
        mutationFn: async ({ messageId, vote }: { messageId: string; vote: 1 | -1 }) => {
            const res = await fetch("/api/community", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "vote", messageId, vote }),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || "Failed");
            return json;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["community-messages"] });
        },
        onError: (err: Error) => toast.error(err.message),
    });

    return (
        <div className="space-y-5 max-w-2xl mx-auto px-1 pb-24">
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
                <h1 className="text-xl font-bold flex items-center gap-2">
                    <MessageCircle className="h-5 w-5 text-primary" />
                    Community
                </h1>
                <div className="h-5 mt-1">
                    <RotatingSubtitle />
                </div>
            </motion.div>

            {/* Community feed */}
            {data?.messages && data.messages.length > 0 && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.05 }}
                    className="space-y-2.5"
                >
                    <AnimatePresence>
                        {data.messages.map((msg) => {
                            const cat = CATEGORIES.find(c => c.value === msg.category);
                            const CatIcon = cat?.icon || MessageCircle;
                            const netVotes = msg.upvotes - msg.downvotes;

                            return (
                                <motion.div
                                    key={msg.id}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -8 }}
                                >
                                    <Card className={`border ${msg.isOwn ? "border-primary/30" : "border-divider"}`}>
                                        <CardBody className="p-3 space-y-2">
                                            {/* Top row */}
                                            <div className="flex items-center gap-2">
                                                {msg.isAnonymous || !msg.player ? (
                                                    <div className="w-6 h-6 rounded-full bg-default-200 flex items-center justify-center shrink-0">
                                                        <EyeOff className="h-3 w-3 text-foreground/40" />
                                                    </div>
                                                ) : (
                                                    <Avatar
                                                        src={msg.player.imageUrl}
                                                        name={msg.player.displayName}
                                                        size="sm"
                                                        className="w-6 h-6 shrink-0"
                                                    />
                                                )}
                                                <span className="text-xs font-medium truncate">
                                                    {msg.isAnonymous ? "Anonymous" : (msg.player?.displayName || "Unknown")}
                                                </span>
                                                <Chip size="sm" variant="flat" color={cat?.color || "default"} className="text-[9px] ml-auto shrink-0">
                                                    <CatIcon className="h-2.5 w-2.5 inline mr-0.5" />
                                                    {cat?.label || msg.category}
                                                </Chip>
                                            </div>

                                            {/* Message */}
                                            <p className="text-sm pl-8">{msg.message}</p>

                                            {/* Admin reply */}
                                            {msg.adminReply && (
                                                <div className="bg-primary/10 rounded-lg px-3 py-2 ml-8">
                                                    <p className="text-[10px] text-primary font-semibold uppercase tracking-wider mb-0.5">
                                                        Admin Reply
                                                    </p>
                                                    <p className="text-xs">{msg.adminReply}</p>
                                                </div>
                                            )}

                                            {/* Bottom row */}
                                            <div className="flex items-center justify-between pl-8">
                                                <div className="flex items-center gap-1">
                                                    <p className="text-[10px] text-foreground/30">
                                                        {new Date(msg.createdAt).toLocaleDateString(undefined, {
                                                            month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
                                                        })}
                                                    </p>
                                                    {msg.isOwn && (
                                                        <Chip size="sm" variant="flat" className="text-[8px] h-4">You</Chip>
                                                    )}
                                                    {msg.isRead && msg.isOwn && (
                                                        <Chip size="sm" variant="flat" color="success" className="text-[8px] h-4">Read</Chip>
                                                    )}
                                                </div>

                                                {/* Vote buttons */}
                                                <div className="flex items-center gap-0.5">
                                                    <Button
                                                        isIconOnly
                                                        size="sm"
                                                        variant={msg.myVote === 1 ? "solid" : "light"}
                                                        color={msg.myVote === 1 ? "success" : "default"}
                                                        className="h-7 w-7 min-w-7"
                                                        onPress={() => voteMutation.mutate({ messageId: msg.id, vote: 1 })}
                                                    >
                                                        <ThumbsUp className="h-3 w-3" />
                                                    </Button>
                                                    <span className={`text-xs font-semibold min-w-[20px] text-center ${netVotes > 0 ? "text-success" : netVotes < 0 ? "text-danger" : "text-foreground/40"}`}>
                                                        {netVotes > 0 ? `+${netVotes}` : netVotes}
                                                    </span>
                                                    <Button
                                                        isIconOnly
                                                        size="sm"
                                                        variant={msg.myVote === -1 ? "solid" : "light"}
                                                        color={msg.myVote === -1 ? "danger" : "default"}
                                                        className="h-7 w-7 min-w-7"
                                                        onPress={() => voteMutation.mutate({ messageId: msg.id, vote: -1 })}
                                                    >
                                                        <ThumbsDown className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </CardBody>
                                    </Card>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </motion.div>
            )}

            {/* Empty state */}
            {data?.messages && data.messages.length === 0 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
                    <Star className="h-10 w-10 text-foreground/15 mx-auto mb-3" />
                    <p className="text-sm text-foreground/40">Be the first to share your thoughts!</p>
                </motion.div>
            )}

            {/* FAB */}
            <motion.div
                className="fixed bottom-20 right-4 z-50"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 20, delay: 0.2 }}
            >
                <Button
                    isIconOnly
                    color="primary"
                    size="lg"
                    className="rounded-full shadow-lg shadow-primary/30 h-14 w-14"
                    onPress={composeModal.onOpen}
                >
                    <Plus className="h-6 w-6" />
                </Button>
            </motion.div>

            {/* Compose Modal */}
            <Modal
                isOpen={composeModal.isOpen}
                onClose={composeModal.onClose}
                placement="center"
                scrollBehavior="inside"
                classNames={{
                    base: "max-h-[85dvh]",
                    body: "pb-6",
                }}
            >
                <ModalContent>
                    <ModalHeader className="flex items-center gap-2 pb-2">
                        <Send className="h-4 w-4 text-primary" />
                        New Message
                    </ModalHeader>
                    <ModalBody className="space-y-3">
                        {/* Category pills */}
                        <div className="flex flex-wrap gap-1.5">
                            {CATEGORIES.map((cat) => {
                                const CatIcon = cat.icon;
                                return (
                                    <Button
                                        key={cat.value}
                                        size="sm"
                                        variant={category === cat.value ? "solid" : "flat"}
                                        color={category === cat.value ? cat.color : "default"}
                                        className="text-xs"
                                        startContent={<CatIcon className="h-3 w-3" />}
                                        onPress={() => setCategory(cat.value)}
                                    >
                                        {cat.label}
                                    </Button>
                                );
                            })}
                        </div>

                        {/* Message input */}
                        <Textarea
                            placeholder={`What's on your mind about ${GAME.name}?`}
                            value={message}
                            onValueChange={setMessage}
                            maxLength={500}
                            minRows={4}
                            maxRows={8}
                            description={`${message.length}/500`}
                        />

                        {/* Anonymous toggle */}
                        <div className="flex items-center gap-2">
                            <Switch
                                size="sm"
                                isSelected={isAnonymous}
                                onValueChange={setIsAnonymous}
                                thumbIcon={isAnonymous
                                    ? <EyeOff className="h-3 w-3" />
                                    : <User className="h-3 w-3" />
                                }
                            />
                            <span className="text-xs text-foreground/60">
                                {isAnonymous ? "Posting as Anonymous" : "Posting with your name"}
                            </span>
                        </div>
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="flat" onPress={composeModal.onClose}>
                            Cancel
                        </Button>
                        <Button
                            color="primary"
                            isDisabled={!message.trim()}
                            isLoading={submit.isPending}
                            startContent={<Send className="h-4 w-4" />}
                            onPress={() => submit.mutate()}
                        >
                            Send
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </div>
    );
}
