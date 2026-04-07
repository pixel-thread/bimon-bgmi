"use client";

import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@heroui/react";
import { HelpCircle, MapPin } from "lucide-react";
import { motion } from "motion/react";

const WhatsAppIcon = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
);

interface HelpContact {
    state: string;
    name: string;
    whatsapp: string;
}

const STATE_EMOJIS: Record<string, string> = {
    Meghalaya: "🏔️",
    Nagaland: "🦅",
    Manipur: "🌸",
};

const STATE_GRADIENTS: Record<string, string> = {
    Meghalaya: "from-emerald-500/10 to-teal-500/10 border-emerald-500/20",
    Nagaland: "from-amber-500/10 to-orange-500/10 border-amber-500/20",
    Manipur: "from-rose-500/10 to-pink-500/10 border-rose-500/20",
};

const FALLBACK_COLORS = [
    "from-blue-500/10 to-indigo-500/10 border-blue-500/20",
    "from-purple-500/10 to-violet-500/10 border-purple-500/20",
    "from-cyan-500/10 to-sky-500/10 border-cyan-500/20",
    "from-lime-500/10 to-green-500/10 border-lime-500/20",
];

export default function HelpPage() {
    const { data, isLoading } = useQuery<{ contacts: HelpContact[] }>({
        queryKey: ["help-contacts"],
        queryFn: async () => {
            const res = await fetch("/api/help/contacts");
            if (!res.ok) throw new Error("Failed to load");
            const json = await res.json();
            return json.data;
        },
    });

    const contacts = data?.contacts ?? [];

    const openWhatsApp = (number: string) => {
        const clean = number.replace(/\D/g, "");
        if (!clean) return;
        window.open(`https://wa.me/${clean}`, "_blank");
    };

    const getGradient = (state: string, idx: number) =>
        STATE_GRADIENTS[state] ?? FALLBACK_COLORS[idx % FALLBACK_COLORS.length];

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
                    </div>
                </div>
            </div>

            <div className="max-w-2xl mx-auto px-4 py-6 space-y-3">
                {isLoading && (
                    <div className="space-y-3">
                        {[1, 2, 3].map(i => (
                            <Skeleton key={i} className="h-24 w-full rounded-2xl" />
                        ))}
                    </div>
                )}

                {!isLoading && contacts.length === 0 && (
                    <div className="text-center py-12">
                        <HelpCircle className="w-12 h-12 text-foreground/20 mx-auto mb-3" />
                        <p className="text-foreground/50">No help contacts available yet</p>
                    </div>
                )}

                {!isLoading && contacts.map((contact, i) => (
                    <motion.div
                        key={contact.state}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.08 }}
                        className={`rounded-2xl border bg-gradient-to-br p-4 ${getGradient(contact.state, i)}`}
                    >
                        <div className="flex items-start gap-3">
                            <div className="text-2xl mt-0.5">
                                {STATE_EMOJIS[contact.state] ?? "📍"}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-2">
                                    <MapPin className="w-3.5 h-3.5 text-foreground/40" />
                                    <h2 className="text-sm font-bold uppercase tracking-wide">
                                        {contact.state}
                                    </h2>
                                </div>
                                {contact.whatsapp ? (
                                    <>
                                        {contact.name && (
                                            <p className="text-sm font-medium text-foreground/80 mb-2">
                                                {contact.name}
                                            </p>
                                        )}
                                        <button
                                            onClick={() => openWhatsApp(contact.whatsapp)}
                                            className="inline-flex items-center gap-1.5 rounded-lg bg-success/15 text-success px-3 py-1.5 text-sm font-semibold transition-colors hover:bg-success/25 active:bg-success/30"
                                        >
                                            <WhatsAppIcon className="w-3.5 h-3.5" />
                                            Chat on WhatsApp
                                        </button>
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

                {!isLoading && contacts.filter(c => c.whatsapp).length > 0 && (
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="text-center text-[11px] text-foreground/30 pt-4"
                    >
                        Tap to contact your local representative via WhatsApp
                    </motion.p>
                )}
            </div>
        </div>
    );
}
