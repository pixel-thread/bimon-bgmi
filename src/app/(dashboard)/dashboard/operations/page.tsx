"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    Card,
    CardBody,
    Button,
    Chip,
    Input,
    Skeleton,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Select,
    SelectItem,
    Textarea,
    useDisclosure,
    Divider,
} from "@heroui/react";
import {
    Trophy,
    Users,
    Gamepad2,
    Vote,
    Medal,
    Plus,
    Flame,
    Calendar,
    Pencil,
    Save,
    X,
    Trash2,
    ImageIcon,
    Upload,
    Gift,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { DeclareWinnersModal } from "@/components/dashboard/declare-winners-modal";
import Image from "next/image";

// ─── Types ───────────────────────────────────────────────────
interface TournamentDTO {
    id: string;
    name: string;
    description: string | null;
    fee: number | null;
    status: string;
    isWinnerDeclared: boolean;
    season: { id: string; name: string } | null;
    startDate: string;
    teamCount: number;
    matchCount: number;
    winnerCount: number;
    poll: { id: string; isActive: boolean; voteCount: number } | null;
}

interface SeasonDTO {
    id: string;
    name: string;
    isCurrent: boolean;
}

/**
 * /dashboard/operations — Admin operations center.
 * Select a tournament, configure, declare winners, manage seasons.
 */
export default function OperationsPage() {
    const queryClient = useQueryClient();
    const createModal = useDisclosure();
    const seasonModal = useDisclosure();
    const winnersModal = useDisclosure();

    const [selectedId, setSelectedId] = useState("");
    const [seasonId, setSeasonId] = useState("");
    const [isEditing, setIsEditing] = useState(false);

    // Edit form
    const [editName, setEditName] = useState("");
    const [editDesc, setEditDesc] = useState("");
    const [editFee, setEditFee] = useState("");

    // Create tournament form
    const [tName, setTName] = useState("");
    const [tDescription, setTDescription] = useState("");
    const [tFee, setTFee] = useState("");
    const [tSeasonId, setTSeasonId] = useState("");

    // Create season form
    const [sName, setSName] = useState("");

    const { data: seasons = [] } = useQuery<SeasonDTO[]>({
        queryKey: ["seasons"],
        queryFn: async () => {
            const res = await fetch("/api/seasons");
            if (!res.ok) return [];
            const json = await res.json();
            return json.data || [];
        },
    });

    // Auto-select current season
    useEffect(() => {
        if (seasons.length > 0 && !seasonId) {
            const current = seasons.find((s) => s.isCurrent);
            setSeasonId(current?.id ?? seasons[0].id);
        }
    }, [seasons, seasonId]);

    const { data: tournaments = [], isLoading } = useQuery<TournamentDTO[]>({
        queryKey: ["admin-tournaments", seasonId],
        queryFn: async () => {
            const url = seasonId
                ? `/api/tournaments?seasonId=${seasonId}`
                : "/api/tournaments";
            const res = await fetch(url);
            if (!res.ok) throw new Error("Failed");
            const json = await res.json();
            return json.data;
        },
        enabled: !!seasonId,
    });

    const selected = tournaments.find((t) => t.id === selectedId);

    // Auto-select first active tournament
    useEffect(() => {
        if (tournaments.length > 0) {
            const active = tournaments.find((t) => t.status === "ACTIVE");
            setSelectedId(active?.id || tournaments[0].id);
        } else {
            setSelectedId("");
        }
    }, [tournaments]);

    // Sync edit form when selection changes
    useEffect(() => {
        if (selected) {
            setEditName(selected.name);
            setEditDesc(selected.description || "");
            setEditFee(selected.fee?.toString() || "0");
        }
    }, [selected?.id]);

    // ─── Mutations ───────────────────────────────────────────
    const updateTournament = useMutation({
        mutationFn: async () => {
            const res = await fetch(`/api/tournaments/${selectedId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: editName.trim(),
                    description: editDesc.trim() || null,
                    fee: editFee ? Number(editFee) : 0,
                }),
            });
            if (!res.ok) throw new Error("Failed to update");
        },
        onSuccess: () => {
            toast.success("Tournament updated!");
            queryClient.invalidateQueries({ queryKey: ["admin-tournaments"] });
            setIsEditing(false);
        },
        onError: () => toast.error("Failed to update"),
    });

    const createTournament = useMutation({
        mutationFn: async () => {
            const res = await fetch("/api/tournaments", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: tName.trim(),
                    description: tDescription.trim() || null,
                    fee: tFee ? Number(tFee) : 0,
                    seasonId: tSeasonId || undefined,
                }),
            });
            if (!res.ok) {
                const d = await res.json();
                throw new Error(d.error || "Failed");
            }
            return res.json();
        },
        onSuccess: (data) => {
            toast.success("Tournament created!");
            queryClient.invalidateQueries({ queryKey: ["admin-tournaments"] });
            createModal.onClose();
            setTName(""); setTDescription(""); setTFee("");
            if (data?.data?.id) setSelectedId(data.data.id);
        },
        onError: (err: Error) => toast.error(err.message),
    });

    const createSeason = useMutation({
        mutationFn: async () => {
            const res = await fetch("/api/seasons", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: sName.trim() }),
            });
            if (!res.ok) {
                const d = await res.json();
                throw new Error(d.error || "Failed");
            }
        },
        onSuccess: () => {
            toast.success("Season created!");
            queryClient.invalidateQueries({ queryKey: ["seasons"] });
            seasonModal.onClose();
            setSName("");
        },
        onError: (err: Error) => toast.error(err.message),
    });


    const updateStreaks = useMutation({
        mutationFn: async () => {
            const res = await fetch(`/api/tournaments/${selectedId}/update-streaks`, {
                method: "POST",
            });
            if (!res.ok) {
                const d = await res.json();
                throw new Error(d.error || "Failed");
            }
            return res.json();
        },
        onSuccess: (data) => {
            if (data?.data?.updated > 0) {
                toast.success(`🔥 Streaks updated for ${data.data.updated} players`);
            } else {
                toast.info("Streaks already up to date");
            }
        },
        onError: (err: Error) => toast.error(err.message),
    });

    const processRewards = useMutation({
        mutationFn: async () => {
            const res = await fetch(`/api/tournaments/${selectedId}/post-declare`, {
                method: "POST",
            });
            if (!res.ok) {
                const d = await res.json();
                throw new Error(d.error || "Failed");
            }
            return res.json();
        },
        onSuccess: (data) => {
            const d = data?.data;
            toast.success(`✅ Merit: ${d?.meritUpdated || 0} updated, Referrals: ${d?.referralsProcessed || 0} paid, ${d?.referralsIncremented || 0} incremented`);
        },
        onError: (err: Error) => toast.error(err.message),
    });

    // ─── Global Background ───────────────────────────────────

    const { data: globalBg, isLoading: bgLoading } = useQuery<{ id: string; publicUrl: string; name: string } | null>({
        queryKey: ["global-background"],
        queryFn: async () => {
            const res = await fetch("/api/gallery/global-background");
            if (!res.ok) return null;
            const json = await res.json();
            return json.data ?? null;
        },
    });

    const { data: galleryItems = [] } = useQuery<{ id: string; publicUrl: string; name: string; isCharacterImg: boolean }[]>({
        queryKey: ["gallery"],
        queryFn: async () => {
            const res = await fetch("/api/gallery");
            if (!res.ok) return [];
            const json = await res.json();
            return json.data ?? [];
        },
    });

    const bgCandidates = galleryItems.filter((g) => !g.isCharacterImg);

    const setBg = useMutation({
        mutationFn: async (galleryId: string) => {
            const res = await fetch("/api/gallery/global-background", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ galleryId }),
            });
            if (!res.ok) throw new Error("Failed");
        },
        onSuccess: () => {
            toast.success("Background updated!");
            queryClient.invalidateQueries({ queryKey: ["global-background"] });
        },
        onError: () => toast.error("Failed to set background"),
    });

    const deleteBg = useMutation({
        mutationFn: async () => {
            const res = await fetch("/api/gallery/global-background", { method: "DELETE" });
            if (!res.ok) throw new Error("Failed");
        },
        onSuccess: () => {
            toast.success("Background removed");
            queryClient.invalidateQueries({ queryKey: ["global-background"] });
        },
        onError: () => toast.error("Failed to remove background"),
    });

    const bgFileRef = useRef<HTMLInputElement>(null);

    const uploadBg = useMutation({
        mutationFn: async (file: File) => {
            const fd = new FormData();
            fd.append("image", file);
            // Upload to gallery
            const uploadRes = await fetch("/api/gallery/upload", { method: "POST", body: fd });
            if (!uploadRes.ok) throw new Error("Upload failed");
            const uploadJson = await uploadRes.json();
            const galleryId = uploadJson.data.id;
            // Set as global background
            const setRes = await fetch("/api/gallery/global-background", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ galleryId }),
            });
            if (!setRes.ok) throw new Error("Failed to set");
        },
        onSuccess: () => {
            toast.success("Background uploaded & set!");
            queryClient.invalidateQueries({ queryKey: ["global-background"] });
            queryClient.invalidateQueries({ queryKey: ["gallery"] });
        },
        onError: () => toast.error("Failed to upload"),
    });

    return (
        <div className="mx-auto max-w-xl space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold">Operations</h1>
                    <p className="text-sm text-foreground/50">
                        Tournaments, seasons & configuration
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button
                        size="sm"
                        variant="flat"
                        startContent={<Calendar className="h-3.5 w-3.5" />}
                        onPress={seasonModal.onOpen}
                    >
                        Season
                    </Button>
                    <Button
                        size="sm"
                        color="primary"
                        startContent={<Plus className="h-3.5 w-3.5" />}
                        onPress={createModal.onOpen}
                    >
                        New
                    </Button>
                </div>
            </div>

            {/* Season Selector */}
            {seasons.length > 0 && (
                <Select
                    label="Season"
                    placeholder="Select season..."
                    selectedKeys={seasonId ? [seasonId] : []}
                    onSelectionChange={(keys) => {
                        const id = Array.from(keys)[0] as string;
                        if (id) { setSeasonId(id); setSelectedId(""); }
                    }}
                    startContent={<Calendar className="h-4 w-4 text-foreground/30" />}
                    size="sm"
                >
                    {seasons.map((s) => (
                        <SelectItem key={s.id} textValue={s.name}>
                            <div className="flex items-center gap-2">
                                <span>{s.name}</span>
                                {s.isCurrent && <Chip size="sm" color="success" variant="flat">Current</Chip>}
                            </div>
                        </SelectItem>
                    ))}
                </Select>
            )}

            {/* Tournament Selector */}
            {isLoading ? (
                <Skeleton className="h-14 w-full rounded-xl" />
            ) : (
                <Select
                    label="Tournament"
                    placeholder="Select tournament..."
                    selectedKeys={selectedId ? [selectedId] : []}
                    onSelectionChange={(keys) => {
                        const id = Array.from(keys)[0] as string;
                        if (id) { setSelectedId(id); setIsEditing(false); }
                    }}
                    startContent={<Gamepad2 className="h-4 w-4 text-foreground/30" />}
                >
                    {tournaments.map((t) => (
                        <SelectItem key={t.id} textValue={t.name}>
                            <div className="flex items-center gap-2">
                                <span>{t.name}</span>
                                <Chip size="sm" variant="dot" color={
                                    t.status === "ACTIVE" ? "success" :
                                        t.status === "INACTIVE" ? "warning" : "danger"
                                }>
                                    {t.status}
                                </Chip>
                            </div>
                        </SelectItem>
                    ))}
                </Select>
            )}

            {/* Selected Tournament Details */}
            {selected && (
                <motion.div
                    key={selected.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <Card className="border border-divider">
                        <CardBody className="space-y-4 p-4">
                            {/* Stats */}
                            <div className="grid grid-cols-4 gap-3">
                                {[
                                    { icon: Users, label: "Teams", value: selected.teamCount },
                                    { icon: Gamepad2, label: "Matches", value: selected.matchCount },
                                    { icon: Vote, label: "Votes", value: selected.poll?.voteCount ?? 0 },
                                    { icon: Trophy, label: "Winners", value: selected.winnerCount },
                                ].map((s) => (
                                    <div key={s.label} className="flex flex-col items-center gap-1 rounded-lg bg-default-50 p-2.5">
                                        <s.icon className="h-3.5 w-3.5 text-foreground/30" />
                                        <span className="text-sm font-bold">{s.value}</span>
                                        <span className="text-[10px] text-foreground/40">{s.label}</span>
                                    </div>
                                ))}
                            </div>

                            <Divider />

                            {/* Config */}
                            {isEditing ? (
                                <div className="space-y-3">
                                    <Input
                                        label="Name"
                                        value={editName}
                                        onValueChange={setEditName}
                                        size="sm"
                                    />
                                    <Textarea
                                        label="Description"
                                        value={editDesc}
                                        onValueChange={setEditDesc}
                                        size="sm"
                                        minRows={2}
                                    />
                                    <Input
                                        label="Entry Fee (UC)"
                                        value={editFee}
                                        onValueChange={setEditFee}
                                        type="number"
                                        size="sm"
                                    />
                                    <div className="flex gap-2 justify-end">
                                        <Button
                                            size="sm"
                                            variant="flat"
                                            startContent={<X className="h-3 w-3" />}
                                            onPress={() => setIsEditing(false)}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            size="sm"
                                            color="primary"
                                            isLoading={updateTournament.isPending}
                                            startContent={<Save className="h-3 w-3" />}
                                            onPress={() => updateTournament.mutate()}
                                        >
                                            Save
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-xs text-foreground/40">Entry Fee</p>
                                            <p className="text-sm font-semibold">
                                                {selected.fee ?? 0} UC
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-foreground/40">Status</p>
                                            <div className="flex items-center gap-1.5">
                                                <Chip
                                                    size="sm"
                                                    variant="flat"
                                                    color={
                                                        selected.status === "ACTIVE" ? "success" :
                                                            selected.status === "INACTIVE" ? "warning" : "danger"
                                                    }
                                                >
                                                    {selected.status}
                                                </Chip>
                                                {selected.isWinnerDeclared && (
                                                    <Medal className="h-3.5 w-3.5 text-warning" />
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    {selected.description && (
                                        <p className="text-xs text-foreground/50">{selected.description}</p>
                                    )}
                                </div>
                            )}

                            <Divider />

                            {/* Actions */}
                            <div className="flex flex-wrap gap-2 justify-end">
                                <Button
                                    size="sm"
                                    variant="flat"
                                    startContent={<Pencil className="h-3 w-3" />}
                                    onPress={() => setIsEditing(true)}
                                    isDisabled={isEditing}
                                >
                                    Edit
                                </Button>
                                <Button
                                    size="sm"
                                    color="warning"
                                    variant="flat"
                                    startContent={<Trophy className="h-3 w-3" />}
                                    onPress={winnersModal.onOpen}
                                >
                                    {selected.isWinnerDeclared ? "View Results" : "View Winners"}
                                </Button>
                                {selected.isWinnerDeclared && (
                                    <>
                                        <Button
                                            size="sm"
                                            color="success"
                                            variant="flat"
                                            isLoading={updateStreaks.isPending}
                                            startContent={<Flame className="h-3 w-3" />}
                                            onPress={() => updateStreaks.mutate()}
                                        >
                                            Update Streaks
                                        </Button>
                                        <Button
                                            size="sm"
                                            color="secondary"
                                            variant="flat"
                                            isLoading={processRewards.isPending}
                                            startContent={<Gift className="h-3 w-3" />}
                                            onPress={() => processRewards.mutate()}
                                        >
                                            Process Rewards
                                        </Button>
                                    </>
                                )}
                            </div>
                        </CardBody>
                    </Card>
                </motion.div>
            )}
            {/* Standings Background */}
            <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
            >
                <Card className="border border-divider">
                    <CardBody className="p-4 space-y-3 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                                <ImageIcon className="h-4 w-4 text-foreground/40 shrink-0" />
                                <div>
                                    <p className="text-sm font-semibold">Standings Background</p>
                                    <p className="text-xs text-foreground/40">Standings & slots export</p>
                                </div>
                            </div>
                            <div className="flex gap-1.5 shrink-0">
                                {globalBg && (
                                    <Button
                                        size="sm"
                                        color="danger"
                                        variant="light"
                                        isIconOnly
                                        onPress={() => deleteBg.mutate()}
                                        isLoading={deleteBg.isPending}
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                )}
                                <Button
                                    size="sm"
                                    variant="flat"
                                    isIconOnly
                                    onPress={() => bgFileRef.current?.click()}
                                    isLoading={uploadBg.isPending}
                                >
                                    <Upload className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        </div>

                        {bgLoading ? (
                            <Skeleton className="h-20 w-full rounded-lg" />
                        ) : bgCandidates.length === 0 ? (
                            <p className="text-xs text-foreground/40 py-4 text-center">No gallery images available</p>
                        ) : (
                            <div className="grid grid-cols-4 gap-2">
                                {bgCandidates.map((img) => {
                                    const isSelected = globalBg?.id === img.id;
                                    return (
                                        <button
                                            key={img.id}
                                            onClick={() => setBg.mutate(img.id)}
                                            disabled={setBg.isPending}
                                            className={`relative aspect-video rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${isSelected
                                                ? "border-primary ring-2 ring-primary/20"
                                                : "border-divider hover:border-foreground/30"
                                                }`}
                                        >
                                            <Image
                                                src={img.publicUrl}
                                                alt={img.name}
                                                fill
                                                className="object-cover"
                                                unoptimized
                                            />
                                            {isSelected && (
                                                <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                                                    <div className="w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                                                        <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    </div>
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        <input
                            ref={bgFileRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                                const f = e.target.files?.[0];
                                if (f) uploadBg.mutate(f);
                                e.target.value = "";
                            }}
                        />
                    </CardBody>
                </Card>
            </motion.div>

            {/* Create Tournament Modal */}
            <Modal isOpen={createModal.isOpen} onClose={createModal.onClose} placement="center">
                <ModalContent>
                    <ModalHeader>Create Tournament</ModalHeader>
                    <ModalBody className="gap-3">
                        <Input
                            label="Name"
                            placeholder="e.g. Lehkai sngewtynnad 11"
                            value={tName}
                            onValueChange={setTName}
                            isRequired
                        />
                        <Textarea
                            label="Description"
                            placeholder="Optional description"
                            value={tDescription}
                            onValueChange={setTDescription}
                            minRows={2}
                        />
                        <Input
                            label="Entry Fee (UC)"
                            placeholder="0"
                            value={tFee}
                            onValueChange={setTFee}
                            type="number"
                        />
                        {seasons.length > 0 && (
                            <Select
                                label="Season"
                                placeholder="Select season"
                                selectedKeys={tSeasonId ? [tSeasonId] : []}
                                onSelectionChange={(keys) =>
                                    setTSeasonId(Array.from(keys)[0] as string || "")
                                }
                            >
                                {seasons.map((s) => (
                                    <SelectItem key={s.id}>
                                        {s.name} {s.isCurrent ? "(Current)" : ""}
                                    </SelectItem>
                                ))}
                            </Select>
                        )}
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="flat" onPress={createModal.onClose}>Cancel</Button>
                        <Button
                            color="primary"
                            isLoading={createTournament.isPending}
                            isDisabled={!tName.trim()}
                            onPress={() => createTournament.mutate()}
                        >
                            Create
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* Create Season Modal */}
            <Modal isOpen={seasonModal.isOpen} onClose={seasonModal.onClose} placement="center">
                <ModalContent>
                    <ModalHeader>Create Season</ModalHeader>
                    <ModalBody>
                        <Input
                            label="Season Name"
                            placeholder="e.g. Season 5"
                            value={sName}
                            onValueChange={setSName}
                            isRequired
                        />
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="flat" onPress={seasonModal.onClose}>Cancel</Button>
                        <Button
                            color="primary"
                            isLoading={createSeason.isPending}
                            isDisabled={!sName.trim()}
                            onPress={() => createSeason.mutate()}
                        >
                            Create
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* Declare Winners Modal */}
            {selected && (
                <DeclareWinnersModal
                    isOpen={winnersModal.isOpen}
                    onClose={winnersModal.onClose}
                    tournamentId={selected.id}
                    tournamentName={selected.name}
                    isWinnerDeclared={selected.isWinnerDeclared}
                    seasonId={seasonId}
                />
            )}
        </div>
    );
}
