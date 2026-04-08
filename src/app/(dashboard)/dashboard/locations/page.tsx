"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
    Card,
    CardBody,
    Button,
    Input,
    Chip,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Skeleton,
    Avatar,
} from "@heroui/react";
import {
    MapPin,
    ChevronDown,
    ChevronRight,
    Trash2,
    Plus,
    Users,
    Search,
    AlertTriangle,
    Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface Town {
    id: string;
    name: string;
    playerCount: number;
}

interface District {
    id: string;
    name: string;
    playerCount: number;
    towns: Town[];
}

interface LocationState {
    id: string;
    name: string;
    playerCount: number;
    districts: District[];
}

export default function LocationsPage() {
    const queryClient = useQueryClient();
    const [search, setSearch] = useState("");
    const [expanded, setExpanded] = useState<Record<string, boolean>>({});
    const [deleteTarget, setDeleteTarget] = useState<{
        level: "state" | "district" | "town";
        id: string;
        name: string;
        playerCount: number;
    } | null>(null);
    const [deleting, setDeleting] = useState(false);

    // Add new state/district
    const [addModal, setAddModal] = useState<{
        level: "state" | "district";
        parentId?: string;
        parentName?: string;
    } | null>(null);
    const [newName, setNewName] = useState("");
    const [adding, setAdding] = useState(false);


    // View players at a location
    const [playersTarget, setPlayersTarget] = useState<{
        state: string;
        district?: string;
        town?: string;
        label: string;
    } | null>(null);
    const [playersData, setPlayersData] = useState<{ id: string; name: string; town: string; district: string; avatar?: string }[]>([]);
    const [playersLoading, setPlayersLoading] = useState(false);

    async function viewPlayers(state: string, district?: string, town?: string, label?: string) {
        setPlayersTarget({ state, district, town, label: label || state });
        setPlayersLoading(true);
        try {
            const params = new URLSearchParams({ state });
            if (district) params.set("district", district);
            if (town) params.set("town", town);
            const res = await fetch(`/api/admin/locations/players?${params}`);
            const json = await res.json();
            setPlayersData(json.data ?? []);
        } catch {
            setPlayersData([]);
        } finally {
            setPlayersLoading(false);
        }
    }



    const { data: locations = [], isLoading } = useQuery<LocationState[]>({
        queryKey: ["admin-locations"],
        queryFn: async () => {
            const res = await fetch("/api/admin/locations");
            if (!res.ok) throw new Error("Failed");
            const json = await res.json();
            return json.data ?? [];
        },
    });

    const toggleExpand = (id: string) => {
        setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
    };

    const filtered = search.trim()
        ? locations.filter(
              (s) =>
                  s.name.toLowerCase().includes(search.toLowerCase()) ||
                  s.districts.some(
                      (d) =>
                          d.name.toLowerCase().includes(search.toLowerCase()) ||
                          d.towns.some((t) =>
                              t.name.toLowerCase().includes(search.toLowerCase())
                          )
                  )
          )
        : locations;

    const totalPlayers = locations.reduce((sum, s) => sum + s.playerCount, 0);
    const totalStates = locations.length;
    const totalDistricts = locations.reduce((sum, s) => sum + s.districts.length, 0);
    const totalTowns = locations.reduce(
        (sum, s) => sum + s.districts.reduce((ds, d) => ds + d.towns.length, 0),
        0
    );

    async function handleDelete() {
        if (!deleteTarget) return;
        setDeleting(true);
        try {
            const params = new URLSearchParams({
                level: deleteTarget.level,
                id: deleteTarget.id,
                name: deleteTarget.name,
            });
            const res = await fetch(`/api/admin/locations?${params}`, {
                method: "DELETE",
            });
            const json = await res.json();
            if (res.ok) {
                toast.success(json.message);
                queryClient.invalidateQueries({ queryKey: ["admin-locations"] });
                queryClient.invalidateQueries({ queryKey: ["locations"] });
                setDeleteTarget(null);
            } else {
                toast.error(json.message || "Failed");
            }
        } catch {
            toast.error("Network error");
        } finally {
            setDeleting(false);
        }
    }

    async function handleAdd() {
        if (!addModal || !newName.trim()) return;
        setAdding(true);
        try {
            const res = await fetch("/api/admin/locations", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    level: addModal.level,
                    name: newName.trim(),
                    parentId: addModal.parentId,
                }),
            });
            const json = await res.json();
            if (res.ok) {
                toast.success(json.message);
                queryClient.invalidateQueries({ queryKey: ["admin-locations"] });
                queryClient.invalidateQueries({ queryKey: ["locations"] });
                setAddModal(null);
                setNewName("");
            } else {
                toast.error(json.message || "Failed");
            }
        } catch {
            toast.error("Network error");
        } finally {
            setAdding(false);
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold">Manage Locations</h1>
                <p className="text-sm text-foreground/50 mt-1">
                    View player distribution and manage states, districts, and towns/villages
                </p>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                    { label: "States", value: totalStates, color: "text-primary" },
                    { label: "Districts", value: totalDistricts, color: "text-secondary" },
                    { label: "Towns/Villages", value: totalTowns, color: "text-warning" },
                    { label: "Players Located", value: totalPlayers, color: "text-success" },
                ].map((stat) => (
                    <Card key={stat.label} className="border border-divider">
                        <CardBody className="p-3 text-center">
                            <p className={`text-2xl font-bold ${stat.color}`}>{isLoading ? "—" : stat.value}</p>
                            <p className="text-[10px] text-foreground/40 uppercase tracking-wider">{stat.label}</p>
                        </CardBody>
                    </Card>
                ))}
            </div>

            {/* Search + Add State */}
            <div className="flex gap-2">
                <Input
                    placeholder="Search locations..."
                    value={search}
                    onValueChange={setSearch}
                    startContent={<Search className="h-4 w-4 text-default-400" />}
                    size="sm"
                    className="flex-1"
                    classNames={{ inputWrapper: "bg-default-100" }}
                />
                <Button
                    size="sm"
                    color="primary"
                    startContent={<Plus className="h-3.5 w-3.5" />}
                    onPress={() => setAddModal({ level: "state" })}
                >
                    Add State
                </Button>

            </div>

            {/* Loading skeleton */}
            {isLoading && (
                <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-16 w-full rounded-xl" />
                    ))}
                </div>
            )}

            {/* Location tree */}
            {!isLoading && (
                <div className="space-y-2">
                    {filtered.length === 0 && (
                        <div className="text-center py-12 space-y-3">
                            <p className="text-sm text-foreground/40">
                                {search ? "No locations match your search" : "No locations yet"}
                            </p>

                        </div>
                    )}

                    {filtered.map((state) => (
                        <Card key={state.id} className="border border-divider overflow-visible">
                            <CardBody className="p-0">
                                {/* State row */}
                                <button
                                    onClick={() => toggleExpand(state.id)}
                                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-default-50 transition-colors"
                                >
                                    {expanded[state.id] ? (
                                        <ChevronDown className="h-4 w-4 text-foreground/40 shrink-0" />
                                    ) : (
                                        <ChevronRight className="h-4 w-4 text-foreground/40 shrink-0" />
                                    )}
                                    <MapPin className="h-4 w-4 text-primary shrink-0" />
                                    <span className="font-semibold text-sm flex-1 text-left">{state.name}</span>
                                    <Chip size="sm" variant="flat" className="text-[10px]">
                                        {state.districts.length} districts
                                    </Chip>
                                    <div
                                        className="flex items-center gap-1 text-xs text-foreground/40 cursor-pointer hover:text-primary transition-colors"
                                        onClick={(e) => { e.stopPropagation(); if (state.playerCount > 0) viewPlayers(state.name, undefined, undefined, state.name); }}
                                    >
                                        <Users className="h-3 w-3" />
                                        {state.playerCount}
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="light"
                                        color="danger"
                                        isIconOnly
                                        className="shrink-0"
                                        onPress={(e) => {
                                            setDeleteTarget({
                                                level: "state",
                                                id: state.id,
                                                name: state.name,
                                                playerCount: state.playerCount,
                                            });
                                        }}
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                </button>

                                {/* Districts */}
                                <AnimatePresence>
                                    {expanded[state.id] && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="overflow-hidden"
                                        >
                                            <div className="border-t border-divider">
                                                {state.districts.map((district) => (
                                                    <div key={district.id}>
                                                        {/* District row */}
                                                        <button
                                                            onClick={() => toggleExpand(district.id)}
                                                            className="w-full flex items-center gap-3 px-4 pl-10 py-2.5 hover:bg-default-50 transition-colors border-b border-divider/50 last:border-b-0"
                                                        >
                                                            {expanded[district.id] ? (
                                                                <ChevronDown className="h-3.5 w-3.5 text-foreground/30 shrink-0" />
                                                            ) : (
                                                                <ChevronRight className="h-3.5 w-3.5 text-foreground/30 shrink-0" />
                                                            )}
                                                            <span className="text-sm flex-1 text-left text-foreground/70">
                                                                {district.name}
                                                            </span>
                                                            <Chip size="sm" variant="flat" className="text-[10px]">
                                                                {district.towns.length} towns/villages
                                                            </Chip>
                                                            <div
                                                                className="flex items-center gap-1 text-xs text-foreground/40 cursor-pointer hover:text-primary transition-colors"
                                                                onClick={(e) => { e.stopPropagation(); if (district.playerCount > 0) viewPlayers(state.name, district.name, undefined, `${district.name}, ${state.name}`); }}
                                                            >
                                                                <Users className="h-3 w-3" />
                                                                {district.playerCount}
                                                            </div>
                                                            <Button
                                                                size="sm"
                                                                variant="light"
                                                                color="danger"
                                                                isIconOnly
                                                                className="shrink-0"
                                                                onPress={() => {
                                                                    setDeleteTarget({
                                                                        level: "district",
                                                                        id: district.id,
                                                                        name: district.name,
                                                                        playerCount: district.playerCount,
                                                                    });
                                                                }}
                                                            >
                                                                <Trash2 className="h-3 w-3" />
                                                            </Button>
                                                        </button>

                                                        {/* Towns */}
                                                        <AnimatePresence>
                                                            {expanded[district.id] && (
                                                                <motion.div
                                                                    initial={{ height: 0, opacity: 0 }}
                                                                    animate={{ height: "auto", opacity: 1 }}
                                                                    exit={{ height: 0, opacity: 0 }}
                                                                    className="overflow-hidden"
                                                                >
                                                                    {district.towns.length === 0 ? (
                                                                        <p className="text-xs text-foreground/30 text-center py-2 pl-16">
                                                                            No towns/villages yet
                                                                        </p>
                                                                    ) : (
                                                                        district.towns.map((town) => (
                                                                            <div
                                                                                key={town.id}
                                                                                className="flex items-center gap-3 px-4 pl-20 py-2 hover:bg-default-50 transition-colors"
                                                                            >
                                                                                <span className="text-xs text-foreground/50 flex-1">
                                                                                    {town.name}
                                                                                </span>
                                                                                <div
                                                                                    className="flex items-center gap-1 text-[10px] text-foreground/30 cursor-pointer hover:text-primary transition-colors"
                                                                                    onClick={() => { if (town.playerCount > 0) viewPlayers(state.name, district.name, town.name, `${town.name}, ${district.name}`); }}
                                                                                >
                                                                                    <Users className="h-2.5 w-2.5" />
                                                                                    {town.playerCount}
                                                                                </div>
                                                                                <Button
                                                                                    size="sm"
                                                                                    variant="light"
                                                                                    color="danger"
                                                                                    isIconOnly
                                                                                    className="shrink-0 min-w-6 h-6"
                                                                                    onPress={() => {
                                                                                        setDeleteTarget({
                                                                                            level: "town",
                                                                                            id: town.id,
                                                                                            name: town.name,
                                                                                            playerCount: town.playerCount,
                                                                                        });
                                                                                    }}
                                                                                >
                                                                                    <Trash2 className="h-2.5 w-2.5" />
                                                                                </Button>
                                                                            </div>
                                                                        ))
                                                                    )}
                                                                </motion.div>
                                                            )}
                                                        </AnimatePresence>
                                                    </div>
                                                ))}

                                                {/* Add district button */}
                                                <button
                                                    onClick={() =>
                                                        setAddModal({
                                                            level: "district",
                                                            parentId: state.id,
                                                            parentName: state.name,
                                                        })
                                                    }
                                                    className="w-full flex items-center gap-2 px-4 pl-10 py-2 text-xs text-foreground/30 hover:text-primary transition-colors"
                                                >
                                                    <Plus className="h-3 w-3" />
                                                    Add district to {state.name}
                                                </button>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </CardBody>
                        </Card>
                    ))}
                </div>
            )}

            {/* Delete confirmation modal */}
            <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} size="sm">
                <ModalContent>
                    <ModalHeader className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-danger" />
                        Delete {deleteTarget?.level}
                    </ModalHeader>
                    <ModalBody>
                        <p className="text-sm">
                            Are you sure you want to delete{" "}
                            <strong>&ldquo;{deleteTarget?.name}&rdquo;</strong>?
                        </p>
                        {deleteTarget?.level === "state" && (
                            <p className="text-xs text-foreground/50">
                                This will also delete all districts and towns under this state.
                            </p>
                        )}
                        {deleteTarget?.level === "district" && (
                            <p className="text-xs text-foreground/50">
                                This will also delete all towns under this district.
                            </p>
                        )}
                        {(deleteTarget?.playerCount ?? 0) > 0 && (
                            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-warning/10 border border-warning/20 text-xs text-warning">
                                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                                {deleteTarget?.playerCount} player(s) will have their location reset
                            </div>
                        )}
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="flat" size="sm" onPress={() => setDeleteTarget(null)} isDisabled={deleting}>
                            Cancel
                        </Button>
                        <Button color="danger" size="sm" onPress={handleDelete} isLoading={deleting}>
                            Delete
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* Add state/district modal */}
            <Modal isOpen={!!addModal} onClose={() => { setAddModal(null); setNewName(""); }} size="sm">
                <ModalContent>
                    <ModalHeader>
                        Add {addModal?.level === "state" ? "State" : `District to ${addModal?.parentName}`}
                    </ModalHeader>
                    <ModalBody>
                        <Input
                            autoFocus
                            placeholder={addModal?.level === "state" ? "e.g. Meghalaya" : "e.g. East Khasi Hills"}
                            value={newName}
                            onValueChange={setNewName}
                            size="sm"
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && newName.trim()) handleAdd();
                            }}
                        />
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="flat" size="sm" onPress={() => { setAddModal(null); setNewName(""); }} isDisabled={adding}>
                            Cancel
                        </Button>
                        <Button color="primary" size="sm" onPress={handleAdd} isLoading={adding} isDisabled={!newName.trim()}>
                            Add
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* View players modal */}
            <Modal isOpen={!!playersTarget} onClose={() => setPlayersTarget(null)} size="sm" scrollBehavior="inside">
                <ModalContent>
                    <ModalHeader className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-primary" />
                        Players in {playersTarget?.label}
                    </ModalHeader>
                    <ModalBody>
                        {playersLoading ? (
                            <div className="space-y-2">
                                {[1, 2, 3].map((i) => (
                                    <Skeleton key={i} className="h-10 w-full rounded-lg" />
                                ))}
                            </div>
                        ) : playersData.length === 0 ? (
                            <p className="text-sm text-foreground/40 text-center py-4">No players found</p>
                        ) : (
                            <div className="space-y-1">
                                {playersData.map((p) => (
                                    <div key={p.id} className="flex items-center gap-3 px-2 py-1.5 rounded-lg hover:bg-default-50">
                                        <Avatar src={p.avatar} name={p.name} size="sm" className="shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">{p.name}</p>
                                            <p className="text-[10px] text-foreground/40 truncate">
                                                {p.town}, {p.district}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                                {playersData.length >= 50 && (
                                    <p className="text-[10px] text-foreground/30 text-center pt-1">Showing first 50</p>
                                )}
                            </div>
                        )}
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="flat" size="sm" onPress={() => setPlayersTarget(null)}>Close</Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </div>
    );
}
