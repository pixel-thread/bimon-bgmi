"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardBody, CardHeader, Divider, Skeleton } from "@heroui/react";
import { BookOpen, ChevronDown } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";

interface Rule {
    id: string;
    title: string;
    content: string;
    order: number;
    createdAt: string;
    updatedAt: string;
}

export default function RulesPage() {
    const [expandedRule, setExpandedRule] = useState<string | null>(null);

    const { data: rules = [], isLoading } = useQuery<Rule[]>({
        queryKey: ["rules"],
        queryFn: async () => {
            const res = await fetch("/api/rules");
            if (!res.ok) throw new Error("Failed to fetch");
            const json = await res.json();
            return json.data;
        },
    });

    return (
        <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
            <div className="mb-6 space-y-1">
                <div className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-primary" />
                    <h1 className="text-lg font-bold">Rules & Guidelines</h1>
                </div>
                <p className="text-sm text-foreground/50">
                    Everything you need to know about tournaments
                </p>
            </div>

            <div className="space-y-3">
                {isLoading &&
                    [1, 2, 3, 4].map((i) => (
                        <Skeleton key={i} className="h-24 w-full rounded-xl" />
                    ))}

                {!isLoading && rules.length === 0 && (
                    <Card className="border border-divider">
                        <CardBody className="flex flex-col items-center gap-3 py-12">
                            <BookOpen className="h-10 w-10 text-foreground/15" />
                            <p className="text-sm text-foreground/40">
                                No rules have been set up yet
                            </p>
                        </CardBody>
                    </Card>
                )}

                {rules.map((rule, i) => {
                    const isExpanded = expandedRule === rule.id;
                    return (
                        <motion.div
                            key={rule.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.04 }}
                        >
                            <Card
                                isPressable
                                onPress={() =>
                                    setExpandedRule(isExpanded ? null : rule.id)
                                }
                                className="border border-divider"
                            >
                                <CardHeader className="justify-between gap-2 pb-0">
                                    <div className="flex items-center gap-2.5">
                                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary/10 text-xs font-bold text-primary">
                                            {i + 1}
                                        </span>
                                        <h2 className="text-sm font-semibold">
                                            {rule.title}
                                        </h2>
                                    </div>
                                    <ChevronDown
                                        className={`h-4 w-4 shrink-0 text-foreground/30 transition-transform ${isExpanded ? "rotate-180" : ""
                                            }`}
                                    />
                                </CardHeader>
                                <CardBody className="pt-2">
                                    <div
                                        className={`whitespace-pre-wrap text-sm leading-relaxed text-foreground/70 ${isExpanded ? "" : "line-clamp-2"
                                            }`}
                                    >
                                        {rule.content}
                                    </div>
                                </CardBody>
                            </Card>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}
