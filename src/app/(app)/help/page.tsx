"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Input, Button, Skeleton } from "@heroui/react";
import { HelpCircle, MapPin, MessageCircle, Pencil, Check, X } from "lucide-react";
import { motion } from "motion/react";
import { useAuthUser } from "@/hooks/use-auth-user";
import { toast } from "sonner";

interface HelpContact {
    state: string;
    name: string;
    whatsapp: string;
}

const STATE_ICONS: Record<string, string> = {
    Meghalaya: "🏔️",
    Nagaland: "🦅",
    Manipur: "🌸",
};

const STATE_COLORS: Record<string, string> = {
    Meghalaya: "from-emerald-500/10 to-teal-500/10 border-emerald-500/20",
    Nagaland: "from-amber-500/10 to-orange-500/10 border-amber-500/20",
    Manipur: "from-rose-500/10 to-pink-500/10 border-rose-500/20",
};

export default function HelpPage() {
    const { isAdmin } = useAuthUser();
    const queryClient = useQueryClient();
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState<HelpContact[]>([]);

    const { data, isLoading } = useQuery<{ contacts: HelpContact[] }>({
        queryKey: ["help-contacts"],
        queryFn: async () => {
            const res = await fetch("/api/help/contacts");
            if (!res.ok) throw new Error("Failed to load");
            const json = await res.json();
            return json.data;
        },
    });

    const save = useMutation({
        mutationFn: async (contacts: HelpContact[]) => {
            const res = await fetch("/api/help/contacts", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ contacts }),
            });
            if (!res.ok) throw new Error("Failed to save");
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["help-contacts"] });
            setEditing(false);
            toast.success("Contacts updated!");
        },
        onError: () => toast.error("Failed to save"),
    });

    const contacts = data?.contacts ?? [];

    const startEdit = () => {
        setDraft(JSON.parse(JSON.stringify(contacts)));
        setEditing(true);
    };

    const updateDraft = (idx: number, field: keyof HelpContact, value: string) => {
        setDraft(prev => prev.map((c, i) => i === idx ? { ...c, [field]: value } : c));
    };

    const openWhatsApp = (number: string) => {
        const clean = number.replace(/\D/g, "");
        if (!clean) return;
        window.open(`https://wa.me/${clean}`, "_blank");
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-background to-default-50">
            {/* Header */}
            <div className="sticky top-16 z-20 bg-background/80 backdrop-blur-lg border-b border-divider">
                <div className="max-w-2xl mx-auto px-4 py-3">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <HelpCircle className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex-1">
                            <h1 className="text-lg font-bold">Help & Support</h1>
                            <p className="text-xs text-foreground/50">
                                Contact a representative from your state
                            </p>
                        </div>
                        {isAdmin && !editing && (
                            <Button
                                size="sm"
                                variant="light"
                                startContent={<Pencil className="w-3 h-3" />}
                                onPress={startEdit}
                            >
                                Edit
                            </Button>
                        )}
                        {editing && (
                            <div className="flex gap-1">
                                <Button
                                    size="sm"
                                    variant="light"
                                    isIconOnly
                                    onPress={() => setEditing(false)}
                                >
                                    <X className="w-4 h-4" />
                                </Button>
                                <Button
                                    size="sm"
                                    color="primary"
                                    isIconOnly
                                    isLoading={save.isPending}
                                    onPress={() => save.mutate(draft)}
                                >
                                    <Check className="w-4 h-4" />
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="max-w-2xl mx-auto px-4 py-6 space-y-3">
                {/* Loading */}
                {isLoading && (
                    <div className="space-y-3">
                        {[1, 2, 3].map(i => (
                            <Skeleton key={i} className="h-24 w-full rounded-2xl" />
                        ))}
                    </div>
                )}

                {/* State Cards */}
                {!isLoading && (editing ? draft : contacts).map((contact, i) => (
                    <motion.div
                        key={contact.state}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.08 }}
                        className={`rounded-2xl border bg-gradient-to-br p-4 ${STATE_COLORS[contact.state] ?? "from-default-100 to-default-50 border-divider"}`}
                    >
                        <div className="flex items-start gap-3">
                            {/* State icon */}
                            <div className="text-2xl mt-0.5">
                                {STATE_ICONS[contact.state] ?? "📍"}
                            </div>

                            <div className="flex-1 min-w-0">
                                {/* State name */}
                                <div className="flex items-center gap-2 mb-2">
                                    <MapPin className="w-3.5 h-3.5 text-foreground/40" />
                                    <h2 className="text-sm font-bold uppercase tracking-wide">
                                        {contact.state}
                                    </h2>
                                </div>

                                {editing ? (
                                    <div className="space-y-2">
                                        <Input
                                            size="sm"
                                            label="Representative Name"
                                            value={draft[i]?.name ?? ""}
                                            onValueChange={(v) => updateDraft(i, "name", v)}
                                            variant="bordered"
                                        />
                                        <Input
                                            size="sm"
                                            label="WhatsApp Number"
                                            placeholder="e.g. 919876543210"
                                            value={draft[i]?.whatsapp ?? ""}
                                            onValueChange={(v) => updateDraft(i, "whatsapp", v)}
                                            variant="bordered"
                                            startContent={<span className="text-foreground/40 text-xs">+</span>}
                                        />
                                    </div>
                                ) : contact.whatsapp ? (
                                    <>
                                        {contact.name && (
                                            <p className="text-sm font-medium text-foreground/80 mb-2">
                                                {contact.name}
                                            </p>
                                        )}
                                        <Button
                                            size="sm"
                                            color="success"
                                            variant="flat"
                                            className="font-semibold"
                                            startContent={<MessageCircle className="w-3.5 h-3.5" />}
                                            onPress={() => openWhatsApp(contact.whatsapp)}
                                        >
                                            Chat on WhatsApp
                                        </Button>
                                    </>
                                ) : (
                                    <p className="text-xs text-foreground/40 italic">
                                        No representative assigned yet
                                    </p>
                                )}
                            </div>
                        </div>
                    </motion.div>
                ))}

                {/* Info Footer */}
                {!isLoading && !editing && (
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="text-center text-[11px] text-foreground/30 pt-4"
                    >
                        Tap on a state to contact your local representative via WhatsApp
                    </motion.p>
                )}
            </div>
        </div>
    );
}
