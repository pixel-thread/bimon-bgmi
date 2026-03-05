"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    Card, CardBody, Button, Textarea, Chip, Switch, Avatar, Input,
    Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure,
} from "@heroui/react";
import {
    MessageCircle, Send, Heart, Lightbulb, Bug, Star, HelpCircle,
    ThumbsUp, ThumbsDown, EyeOff, User, Plus, BarChart3,
    Check, X, PlusCircle,
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

interface PollOptionDTO {
    id: string;
    text: string;
    votes: number;
    addedBy: string | null;
}

interface PollDTO {
    id: string;
    question: string;
    isOwn: boolean;
    creatorName: string;
    totalVotes: number;
    myVoteOptionId: string | null;
    createdAt: string;
    options: PollOptionDTO[];
    pendingSuggestions: { id: string; text: string; suggestedBy: string }[];
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

// ─── Poll Card ────────────────────────────────────────────────
function PollCard({ poll, onVote, onSuggest, onApprove, onReject }: {
    poll: PollDTO;
    onVote: (pollId: string, optionId: string) => void;
    onSuggest: (pollId: string, text: string) => void;
    onApprove: (optionId: string) => void;
    onReject: (optionId: string) => void;
}) {
    const [suggestText, setSuggestText] = useState("");
    const [showSuggest, setShowSuggest] = useState(false);
    const maxVotes = Math.max(...poll.options.map(o => o.votes), 1);

    return (
        <Card className={`border ${poll.isOwn ? "border-primary/30" : "border-divider"}`}>
            <CardBody className="p-3 space-y-2.5">
                {/* Header */}
                <div className="flex items-start gap-2">
                    <div className="w-6 h-6 rounded-full bg-secondary/20 flex items-center justify-center shrink-0 mt-0.5">
                        <BarChart3 className="h-3 w-3 text-secondary" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold">{poll.question}</p>
                        <p className="text-[10px] text-foreground/40">
                            by {poll.creatorName} · {poll.totalVotes} vote{poll.totalVotes !== 1 ? "s" : ""}
                        </p>
                    </div>
                    {poll.isOwn && (
                        <Chip size="sm" variant="flat" className="text-[8px] h-4 shrink-0">You</Chip>
                    )}
                </div>

                {/* Options with vote bars */}
                <div className="space-y-1.5 pl-8">
                    {poll.options.map((opt) => {
                        const pct = poll.totalVotes > 0 ? (opt.votes / poll.totalVotes) * 100 : 0;
                        const isSelected = poll.myVoteOptionId === opt.id;
                        const isWinning = opt.votes === maxVotes && opt.votes > 0;

                        return (
                            <button
                                key={opt.id}
                                onClick={() => onVote(poll.id, opt.id)}
                                className="w-full text-left relative overflow-hidden rounded-lg border border-divider transition-all hover:border-primary/40"
                            >
                                {/* Bar fill */}
                                <div
                                    className={`absolute inset-y-0 left-0 transition-all duration-500 ${isSelected ? "bg-primary/20" : isWinning ? "bg-success/10" : "bg-foreground/5"}`}
                                    style={{ width: `${pct}%` }}
                                />
                                <div className="relative flex items-center justify-between px-3 py-2">
                                    <div className="flex items-center gap-1.5">
                                        {isSelected && (
                                            <Check className="h-3 w-3 text-primary shrink-0" />
                                        )}
                                        <span className={`text-xs ${isSelected ? "font-semibold text-primary" : "font-medium"}`}>
                                            {opt.text}
                                        </span>
                                        {opt.addedBy && (
                                            <span className="text-[9px] text-foreground/30">+{opt.addedBy}</span>
                                        )}
                                    </div>
                                    <span className={`text-[10px] font-semibold ${isWinning ? "text-success" : "text-foreground/40"}`}>
                                        {opt.votes} ({pct.toFixed(0)}%)
                                    </span>
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* Suggest option */}
                <div className="pl-8">
                    {showSuggest ? (
                        <div className="flex gap-1.5">
                            <Input
                                size="sm"
                                placeholder="Suggest an option..."
                                value={suggestText}
                                onValueChange={setSuggestText}
                                maxLength={100}
                                className="flex-1"
                            />
                            <Button
                                isIconOnly
                                size="sm"
                                color="primary"
                                variant="flat"
                                isDisabled={!suggestText.trim()}
                                onPress={() => {
                                    onSuggest(poll.id, suggestText.trim());
                                    setSuggestText("");
                                    setShowSuggest(false);
                                }}
                            >
                                <Send className="h-3 w-3" />
                            </Button>
                            <Button
                                isIconOnly
                                size="sm"
                                variant="light"
                                onPress={() => { setShowSuggest(false); setSuggestText(""); }}
                            >
                                <X className="h-3 w-3" />
                            </Button>
                        </div>
                    ) : (
                        <button
                            onClick={() => setShowSuggest(true)}
                            className="flex items-center gap-1 text-[10px] text-foreground/40 hover:text-primary transition-colors"
                        >
                            <PlusCircle className="h-3 w-3" />
                            Suggest option
                        </button>
                    )}
                </div>

                {/* Pending suggestions (creator only) */}
                {poll.pendingSuggestions.length > 0 && (
                    <div className="pl-8 space-y-1">
                        <p className="text-[9px] text-orange-500 uppercase tracking-wider font-semibold">
                            Pending Suggestions
                        </p>
                        {poll.pendingSuggestions.map((s) => (
                            <div key={s.id} className="flex items-center justify-between bg-orange-500/10 rounded-lg px-2.5 py-1.5">
                                <div>
                                    <span className="text-xs font-medium">{s.text}</span>
                                    <span className="text-[9px] text-foreground/40 ml-1">by {s.suggestedBy}</span>
                                </div>
                                <div className="flex gap-1">
                                    <Button isIconOnly size="sm" variant="light" color="success" onPress={() => onApprove(s.id)}>
                                        <Check className="h-3 w-3" />
                                    </Button>
                                    <Button isIconOnly size="sm" variant="light" color="danger" onPress={() => onReject(s.id)}>
                                        <X className="h-3 w-3" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardBody>
        </Card>
    );
}

// ─── Main Page ────────────────────────────────────────────────
export default function CommunityPage() {
    const queryClient = useQueryClient();
    const composeModal = useDisclosure();
    const pollModal = useDisclosure();
    const [fabOpen, setFabOpen] = useState(false);
    const [message, setMessage] = useState("");
    const [category, setCategory] = useState("feedback");
    const [isAnonymous, setIsAnonymous] = useState(false);

    // Poll creation form
    const [pollQuestion, setPollQuestion] = useState("");
    const [pollOptions, setPollOptions] = useState(["", ""]);

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

    // Fetch community polls
    const { data: polls = [] } = useQuery<PollDTO[]>({
        queryKey: ["community-polls"],
        queryFn: async () => {
            const res = await fetch("/api/community/polls");
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

    // Create poll
    const createPoll = useMutation({
        mutationFn: async () => {
            const res = await fetch("/api/community/polls", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    question: pollQuestion,
                    options: pollOptions.filter(o => o.trim()),
                }),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || "Failed");
            return json;
        },
        onSuccess: (data) => {
            toast.success(data.message);
            setPollQuestion("");
            setPollOptions(["", ""]);
            pollModal.onClose();
            queryClient.invalidateQueries({ queryKey: ["community-polls"] });
        },
        onError: (err: Error) => toast.error(err.message),
    });

    // Vote on poll
    const voteMutation = useMutation({
        mutationFn: async ({ pollId, optionId }: { pollId: string; optionId: string }) => {
            const res = await fetch("/api/community/polls", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "vote", pollId, optionId }),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || "Failed");
            return json;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["community-polls"] }),
        onError: (err: Error) => toast.error(err.message),
    });

    // Suggest option
    const suggestMutation = useMutation({
        mutationFn: async ({ pollId, text }: { pollId: string; text: string }) => {
            const res = await fetch("/api/community/polls", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "suggest", pollId, text }),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || "Failed");
            return json;
        },
        onSuccess: (data) => {
            toast.success(data.message);
            queryClient.invalidateQueries({ queryKey: ["community-polls"] });
        },
        onError: (err: Error) => toast.error(err.message),
    });

    // Approve/reject suggestion
    const moderateMutation = useMutation({
        mutationFn: async ({ action, optionId }: { action: "approve" | "reject"; optionId: string }) => {
            const res = await fetch("/api/community/polls", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action, optionId }),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || "Failed");
            return json;
        },
        onSuccess: (data) => {
            toast.success(data.message);
            queryClient.invalidateQueries({ queryKey: ["community-polls"] });
        },
        onError: (err: Error) => toast.error(err.message),
    });

    // Vote on message
    const msgVoteMutation = useMutation({
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

    const addPollOption = () => {
        if (pollOptions.length < 10) setPollOptions([...pollOptions, ""]);
    };

    const removePollOption = (i: number) => {
        if (pollOptions.length > 2) setPollOptions(pollOptions.filter((_, idx) => idx !== i));
    };

    const updatePollOption = (i: number, val: string) => {
        setPollOptions(pollOptions.map((o, idx) => idx === i ? val : o));
    };

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

            {/* Active polls */}
            {polls.length > 0 && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.03 }}
                    className="space-y-2.5"
                >
                    {polls.map((poll) => (
                        <PollCard
                            key={poll.id}
                            poll={poll}
                            onVote={(pId, oId) => voteMutation.mutate({ pollId: pId, optionId: oId })}
                            onSuggest={(pId, text) => suggestMutation.mutate({ pollId: pId, text })}
                            onApprove={(oId) => moderateMutation.mutate({ action: "approve", optionId: oId })}
                            onReject={(oId) => moderateMutation.mutate({ action: "reject", optionId: oId })}
                        />
                    ))}
                </motion.div>
            )}

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
                                                        onPress={() => msgVoteMutation.mutate({ messageId: msg.id, vote: 1 })}
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
                                                        onPress={() => msgVoteMutation.mutate({ messageId: msg.id, vote: -1 })}
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
            {data?.messages && data.messages.length === 0 && polls.length === 0 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
                    <Star className="h-10 w-10 text-foreground/15 mx-auto mb-3" />
                    <p className="text-sm text-foreground/40">Be the first to share your thoughts!</p>
                </motion.div>
            )}

            {/* FAB with menu */}
            <div className="fixed bottom-20 right-4 z-50">
                <AnimatePresence>
                    {fabOpen && (
                        <>
                            {/* Backdrop */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="fixed inset-0 bg-black/20 backdrop-blur-[1px] z-40"
                                onClick={() => setFabOpen(false)}
                            />
                            {/* Menu items */}
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                className="absolute bottom-16 right-0 flex flex-col gap-2 items-end z-50"
                            >
                                <Button
                                    size="sm"
                                    color="secondary"
                                    className="rounded-full shadow-lg pl-3 pr-4"
                                    startContent={<BarChart3 className="h-4 w-4" />}
                                    onPress={() => {
                                        setFabOpen(false);
                                        pollModal.onOpen();
                                    }}
                                >
                                    New Poll
                                </Button>
                                <Button
                                    size="sm"
                                    color="primary"
                                    className="rounded-full shadow-lg pl-3 pr-4"
                                    startContent={<Send className="h-4 w-4" />}
                                    onPress={() => {
                                        setFabOpen(false);
                                        composeModal.onOpen();
                                    }}
                                >
                                    New Message
                                </Button>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 20, delay: 0.2 }}
                >
                    <Button
                        isIconOnly
                        color="primary"
                        size="lg"
                        className="rounded-full shadow-lg shadow-primary/30 h-14 w-14 z-50 relative"
                        onPress={() => setFabOpen(!fabOpen)}
                    >
                        <motion.div animate={{ rotate: fabOpen ? 45 : 0 }} transition={{ duration: 0.2 }}>
                            <Plus className="h-6 w-6" />
                        </motion.div>
                    </Button>
                </motion.div>
            </div>

            {/* Compose Message Modal */}
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

            {/* Create Poll Modal */}
            <Modal
                isOpen={pollModal.isOpen}
                onClose={pollModal.onClose}
                placement="center"
                scrollBehavior="inside"
                classNames={{
                    base: "max-h-[85dvh]",
                    body: "pb-6",
                }}
            >
                <ModalContent>
                    <ModalHeader className="flex items-center gap-2 pb-2">
                        <BarChart3 className="h-4 w-4 text-secondary" />
                        New Poll
                    </ModalHeader>
                    <ModalBody className="space-y-3">
                        <Input
                            label="Question"
                            placeholder="What should we decide?"
                            value={pollQuestion}
                            onValueChange={setPollQuestion}
                            maxLength={200}
                        />

                        <div className="space-y-2">
                            <p className="text-xs font-medium text-foreground/60">Options</p>
                            {pollOptions.map((opt, i) => (
                                <div key={i} className="flex gap-1.5">
                                    <Input
                                        size="sm"
                                        placeholder={`Option ${i + 1}`}
                                        value={opt}
                                        onValueChange={(v) => updatePollOption(i, v)}
                                        maxLength={100}
                                    />
                                    {pollOptions.length > 2 && (
                                        <Button
                                            isIconOnly
                                            size="sm"
                                            variant="light"
                                            color="danger"
                                            onPress={() => removePollOption(i)}
                                        >
                                            <X className="h-3 w-3" />
                                        </Button>
                                    )}
                                </div>
                            ))}
                            {pollOptions.length < 10 && (
                                <Button
                                    size="sm"
                                    variant="flat"
                                    startContent={<Plus className="h-3 w-3" />}
                                    onPress={addPollOption}
                                    className="text-xs"
                                >
                                    Add Option
                                </Button>
                            )}
                        </div>
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="flat" onPress={pollModal.onClose}>
                            Cancel
                        </Button>
                        <Button
                            color="secondary"
                            isDisabled={!pollQuestion.trim() || pollOptions.filter(o => o.trim()).length < 2}
                            isLoading={createPoll.isPending}
                            startContent={<BarChart3 className="h-4 w-4" />}
                            onPress={() => createPoll.mutate()}
                        >
                            Create Poll
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </div>
    );
}
