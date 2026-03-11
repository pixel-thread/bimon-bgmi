"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    Card,
    CardBody,
    Button,
    Skeleton,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Input,
    Textarea,
    useDisclosure,
    Chip,
} from "@heroui/react";
import {
    BookOpen,
    Plus,
    Pencil,
    Trash2,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";

interface Rule {
    id: string;
    title: string;
    content: string;
    order: number;
    createdAt: string;
    updatedAt: string;
}

export default function AdminRulesPage() {
    const queryClient = useQueryClient();
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [editingRule, setEditingRule] = useState<Rule | null>(null);
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");

    const { data: rules = [], isLoading } = useQuery<Rule[]>({
        queryKey: ["rules"],
        queryFn: async () => {
            const res = await fetch("/api/rules");
            if (!res.ok) throw new Error("Failed");
            const json = await res.json();
            return json.data;
        },
    });

    const saveRule = useMutation({
        mutationFn: async () => {
            const url = editingRule ? `/api/rules/${editingRule.id}` : "/api/rules";
            const method = editingRule ? "PUT" : "POST";
            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title,
                    content,
                    order: editingRule ? editingRule.order : rules.length + 1,
                }),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || "Failed to save rule");
            }
            const json = await res.json();
            return json.data as Rule;
        },
        onMutate: async () => {
            await queryClient.cancelQueries({ queryKey: ["rules"] });
            const previous = queryClient.getQueryData<Rule[]>(["rules"]);

            if (editingRule) {
                queryClient.setQueryData<Rule[]>(["rules"], (old = []) =>
                    old.map((r) =>
                        r.id === editingRule.id
                            ? { ...r, title: title.trim(), content: content.trim() }
                            : r
                    )
                );
            } else {
                const tempRule: Rule = {
                    id: `temp-${Date.now()}`,
                    title: title.trim(),
                    content: content.trim(),
                    order: rules.length + 1,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                };
                queryClient.setQueryData<Rule[]>(["rules"], (old = []) => [
                    ...old,
                    tempRule,
                ]);
            }

            handleClose();
            return { previous };
        },
        onSuccess: (_data, _vars, _ctx) => {
            toast.success(editingRule ? "Rule updated" : "Rule created");
        },
        onError: (err, _vars, context) => {
            if (context?.previous) {
                queryClient.setQueryData(["rules"], context.previous);
            }
            toast.error(err.message || "Failed to save rule");
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["rules"] });
        },
    });

    const deleteRule = useMutation({
        mutationFn: async (id: string) => {
            const res = await fetch(`/api/rules/${id}`, { method: "DELETE" });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || "Failed to delete");
            }
        },
        onMutate: async (id) => {
            await queryClient.cancelQueries({ queryKey: ["rules"] });
            const previous = queryClient.getQueryData<Rule[]>(["rules"]);
            queryClient.setQueryData<Rule[]>(["rules"], (old = []) =>
                old.filter((r) => r.id !== id)
            );
            return { previous };
        },
        onSuccess: () => {
            toast.success("Rule deleted");
        },
        onError: (err, _id, context) => {
            if (context?.previous) {
                queryClient.setQueryData(["rules"], context.previous);
            }
            toast.error(err.message || "Failed to delete rule");
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["rules"] });
        },
    });

    const deleteAll = useMutation({
        mutationFn: async () => {
            const res = await fetch("/api/rules", { method: "DELETE" });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || "Failed to clear rules");
            }
        },
        onMutate: async () => {
            await queryClient.cancelQueries({ queryKey: ["rules"] });
            const previous = queryClient.getQueryData<Rule[]>(["rules"]);
            queryClient.setQueryData<Rule[]>(["rules"], []);
            return { previous };
        },
        onSuccess: () => {
            toast.success("All rules cleared");
        },
        onError: (err, _vars, context) => {
            if (context?.previous) {
                queryClient.setQueryData(["rules"], context.previous);
            }
            toast.error(err.message || "Failed to clear rules");
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["rules"] });
        },
    });

    const handleOpen = (rule?: Rule) => {
        if (rule) {
            setEditingRule(rule);
            setTitle(rule.title);
            setContent(rule.content);
        } else {
            setEditingRule(null);
            setTitle("");
            setContent("");
        }
        onOpen();
    };

    const handleClose = () => {
        setEditingRule(null);
        setTitle("");
        setContent("");
        onClose();
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold">Rules</h1>
                    <p className="text-sm text-foreground/50">
                        Manage tournament rules and guidelines
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {rules.length > 0 && (
                        <>
                            <Chip size="sm" variant="flat" color="primary">
                                {rules.length} rule{rules.length !== 1 ? "s" : ""}
                            </Chip>
                            <Button
                                size="sm"
                                variant="flat"
                                color="danger"
                                startContent={<Trash2 className="h-3.5 w-3.5" />}
                                onPress={() => {
                                    if (confirm("Delete ALL rules? This cannot be undone."))
                                        deleteAll.mutate();
                                }}
                                isLoading={deleteAll.isPending}
                            >
                                Clear All
                            </Button>
                        </>
                    )}
                    <Button
                        size="sm"
                        color="primary"
                        startContent={<Plus className="h-3.5 w-3.5" />}
                        onPress={() => handleOpen()}
                    >
                        Add Rule
                    </Button>
                </div>
            </div>

            {isLoading && (
                <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-20 w-full rounded-xl" />
                    ))}
                </div>
            )}

            {!isLoading && rules.length === 0 && (
                <Card className="border border-divider">
                    <CardBody className="flex flex-col items-center gap-3 py-12">
                        <BookOpen className="h-10 w-10 text-foreground/15" />
                        <p className="text-sm text-foreground/40">No rules yet</p>
                        <Button
                            size="sm"
                            color="primary"
                            startContent={<Plus className="h-3.5 w-3.5" />}
                            onPress={() => handleOpen()}
                        >
                            Create First Rule
                        </Button>
                    </CardBody>
                </Card>
            )}

            <div className="space-y-2">
                <AnimatePresence mode="popLayout">
                    {rules.map((rule, i) => (
                        <motion.div
                            key={rule.id}
                            layout
                            initial={{ opacity: 0, scale: 0.95, y: 8 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, x: -20 }}
                            transition={{
                                layout: { type: "spring", stiffness: 500, damping: 35 },
                                opacity: { duration: 0.2 },
                                scale: { duration: 0.2 },
                            }}
                        >
                            <Card className="border border-divider">
                                <CardBody className="flex flex-row items-start gap-3 p-3">
                                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
                                        {i + 1}
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-semibold">{rule.title}</p>
                                        <p className="mt-0.5 line-clamp-2 text-xs text-foreground/50 whitespace-pre-wrap">
                                            {rule.content}
                                        </p>
                                    </div>
                                    <div className="flex shrink-0 gap-1">
                                        <Button
                                            isIconOnly
                                            size="sm"
                                            variant="light"
                                            onPress={() => handleOpen(rule)}
                                        >
                                            <Pencil className="h-3.5 w-3.5" />
                                        </Button>
                                        <Button
                                            isIconOnly
                                            size="sm"
                                            variant="light"
                                            color="danger"
                                            onPress={() => {
                                                if (confirm(`Delete "${rule.title}"?`))
                                                    deleteRule.mutate(rule.id);
                                            }}
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                </CardBody>
                            </Card>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Add/Edit Rule Modal */}
            <Modal isOpen={isOpen} onClose={handleClose} placement="center" size="lg">
                <ModalContent>
                    <ModalHeader>
                        {editingRule ? "Edit Rule" : "Add Rule"}
                    </ModalHeader>
                    <ModalBody className="gap-4">
                        <Input
                            label="Title"
                            placeholder="e.g. Tournament Rules"
                            value={title}
                            onValueChange={setTitle}
                        />
                        <Textarea
                            label="Content"
                            placeholder="Enter the rule details..."
                            value={content}
                            onValueChange={setContent}
                            minRows={4}
                            maxRows={10}
                        />
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="flat" onPress={handleClose}>
                            Cancel
                        </Button>
                        <Button
                            color="primary"
                            isLoading={saveRule.isPending}
                            isDisabled={!title.trim() || !content.trim()}
                            onPress={() => saveRule.mutate()}
                        >
                            {editingRule ? "Save" : "Create"}
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </div>
    );
}
