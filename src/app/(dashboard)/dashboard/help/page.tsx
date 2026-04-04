"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Input, Button, Card, CardBody } from "@heroui/react";
import { HelpCircle, Plus, Trash2, Save, GripVertical } from "lucide-react";
import { toast } from "sonner";

interface HelpContact {
    state: string;
    name: string;
    whatsapp: string;
}

export default function DashboardHelpPage() {
    const queryClient = useQueryClient();
    const [draft, setDraft] = useState<HelpContact[] | null>(null);

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
            setDraft(null);
            toast.success("Help contacts saved!");
        },
        onError: () => toast.error("Failed to save contacts"),
    });

    const contacts = data?.contacts ?? [];
    const editing = draft ?? contacts;
    const hasChanges = draft !== null;

    const startEditing = () => {
        if (!draft) setDraft(JSON.parse(JSON.stringify(contacts)));
    };

    const updateField = (idx: number, field: keyof HelpContact, value: string) => {
        startEditing();
        setDraft(prev => {
            const list = prev ? [...prev] : JSON.parse(JSON.stringify(contacts));
            list[idx] = { ...list[idx], [field]: value };
            return list;
        });
    };

    const addState = () => {
        startEditing();
        setDraft(prev => {
            const list = prev ? [...prev] : JSON.parse(JSON.stringify(contacts));
            list.push({ state: "", name: "", whatsapp: "" });
            return list;
        });
    };

    const removeState = (idx: number) => {
        startEditing();
        setDraft(prev => {
            const list = prev ? [...prev] : JSON.parse(JSON.stringify(contacts));
            list.splice(idx, 1);
            return list;
        });
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <HelpCircle className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold">Help Contacts</h1>
                        <p className="text-sm text-foreground/50">
                            Manage state representatives for player support
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    {hasChanges && (
                        <Button
                            size="sm"
                            variant="flat"
                            onPress={() => setDraft(null)}
                        >
                            Cancel
                        </Button>
                    )}
                    <Button
                        size="sm"
                        color="primary"
                        startContent={<Save className="w-3.5 h-3.5" />}
                        isLoading={save.isPending}
                        isDisabled={!hasChanges}
                        onPress={() => draft && save.mutate(draft)}
                    >
                        Save
                    </Button>
                </div>
            </div>

            {/* State Cards */}
            {isLoading ? (
                <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                        <Card key={i} className="border border-divider">
                            <CardBody className="h-24" />
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="space-y-3">
                    {editing.map((contact, i) => (
                        <Card key={i} className="border border-divider">
                            <CardBody className="gap-3">
                                <div className="flex items-center gap-2">
                                    <GripVertical className="w-4 h-4 text-foreground/20 flex-shrink-0" />
                                    <span className="text-xs font-bold uppercase tracking-wider text-foreground/40 flex-shrink-0 w-6">
                                        #{i + 1}
                                    </span>
                                    <Input
                                        size="sm"
                                        label="State Name"
                                        value={contact.state}
                                        onValueChange={(v) => updateField(i, "state", v)}
                                        variant="bordered"
                                        className="flex-1"
                                    />
                                    <Button
                                        size="sm"
                                        variant="light"
                                        color="danger"
                                        isIconOnly
                                        onPress={() => removeState(i)}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                                <div className="grid grid-cols-2 gap-3 pl-10">
                                    <Input
                                        size="sm"
                                        label="Representative Name"
                                        value={contact.name}
                                        onValueChange={(v) => updateField(i, "name", v)}
                                        variant="bordered"
                                    />
                                    <Input
                                        size="sm"
                                        label="WhatsApp Number"
                                        placeholder="e.g. 919876543210"
                                        value={contact.whatsapp}
                                        onValueChange={(v) => updateField(i, "whatsapp", v)}
                                        variant="bordered"
                                        startContent={<span className="text-foreground/40 text-xs">+</span>}
                                    />
                                </div>
                            </CardBody>
                        </Card>
                    ))}

                    {/* Add State Button */}
                    <Button
                        fullWidth
                        variant="bordered"
                        className="border-dashed border-foreground/20 text-foreground/50 h-14"
                        startContent={<Plus className="w-4 h-4" />}
                        onPress={addState}
                    >
                        Add State
                    </Button>
                </div>
            )}

            {/* Info */}
            <p className="text-xs text-foreground/30 text-center">
                Players will see these contacts on the Help page and can tap to open WhatsApp directly.
            </p>
        </div>
    );
}
