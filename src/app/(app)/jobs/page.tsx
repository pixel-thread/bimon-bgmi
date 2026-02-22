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
    Select,
    SelectItem,
    Chip,
    useDisclosure,
} from "@heroui/react";
import {
    Briefcase,
    Plus,
    Phone,
    MapPin,
    ThumbsUp,
    ThumbsDown,
    Pencil,
    Trash2,
    Clock,
    Search,
} from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { useAuthUser } from "@/hooks/use-auth-user";

// ─── Constants ───────────────────────────────────────────────
const JOB_CATEGORIES = [
    "Painter",
    "Shopkeeper",
    "Driver",
    "Electrician",
    "Plumber",
    "Mechanic",
    "Tutor/Teacher",
    "Delivery",
    "Carpenter",
    "Tailor",
    "Cook/Chef",
    "Other",
];

const EXPERIENCE_OPTIONS = [
    { value: "1_MONTH", label: "1 Month" },
    { value: "6_MONTHS", label: "6 Months" },
    { value: "1_YEAR", label: "1 Year" },
    { value: "2_YEARS", label: "2 Years" },
    { value: "3_YEARS_PLUS", label: "3+ Years" },
];

// ─── Types ───────────────────────────────────────────────────
interface JobListing {
    id: string;
    playerId: string;
    category: string;
    category2: string | null;
    customCategory: string | null;
    title: string;
    description: string | null;
    phoneNumber: string;
    experience: string | null;
    location: string | null;
    likeCount: number;
    dislikeCount: number;
    createdAt: string;
    player?: {
        id: string;
        displayName: string | null;
        user: { username: string };
    };
    userReaction?: "like" | "dislike" | null;
}

// ─── Page ────────────────────────────────────────────────────
export default function JobsPage() {
    const queryClient = useQueryClient();
    const { isOpen, onOpen, onClose } = useDisclosure();
    const { isSignedIn } = useAuthUser();
    const [filterCategory, setFilterCategory] = useState<string>("all");
    const [search, setSearch] = useState("");

    // Form state
    const [category, setCategory] = useState("");
    const [customCategory, setCustomCategory] = useState("");
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [experience, setExperience] = useState("");
    const [location, setLocation] = useState("");
    const [editingId, setEditingId] = useState<string | null>(null);

    // ─── Queries ─────────────────────────────────────────────
    const { data: listings = [], isLoading } = useQuery<JobListing[]>({
        queryKey: ["job-listings"],
        queryFn: async () => {
            const res = await fetch("/api/job-listings");
            if (!res.ok) throw new Error("Failed");
            const json = await res.json();
            return json.data;
        },
    });

    const { data: myListing } = useQuery<JobListing | null>({
        queryKey: ["my-job-listing"],
        queryFn: async () => {
            const res = await fetch("/api/job-listings/my");
            if (!res.ok) return null;
            const json = await res.json();
            return json.data;
        },
        enabled: isSignedIn,
    });

    // ─── Mutations ───────────────────────────────────────────
    const saveListing = useMutation({
        mutationFn: async () => {
            const url = editingId ? `/api/job-listings/${editingId}` : "/api/job-listings";
            const method = editingId ? "PUT" : "POST";
            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    category,
                    customCategory: category === "Other" ? customCategory : undefined,
                    title,
                    description: description || undefined,
                    phoneNumber,
                    experience: experience || undefined,
                    location: location || undefined,
                }),
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed");
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["job-listings"] });
            queryClient.invalidateQueries({ queryKey: ["my-job-listing"] });
            handleClose();
        },
    });

    const deleteListing = useMutation({
        mutationFn: async (id: string) => {
            const res = await fetch(`/api/job-listings/${id}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Failed");
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["job-listings"] });
            queryClient.invalidateQueries({ queryKey: ["my-job-listing"] });
        },
    });

    const reactToListing = useMutation({
        mutationFn: async ({ id, reactionType }: { id: string; reactionType: string }) => {
            const res = await fetch(`/api/job-listings/${id}/react`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ reactionType }),
            });
            if (!res.ok) throw new Error("Failed");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["job-listings"] });
        },
    });

    // ─── Handlers ────────────────────────────────────────────
    const handleOpen = (listing?: JobListing) => {
        if (listing) {
            setEditingId(listing.id);
            setCategory(listing.category);
            setCustomCategory(listing.customCategory || "");
            setTitle(listing.title);
            setDescription(listing.description || "");
            setPhoneNumber(listing.phoneNumber);
            setExperience(listing.experience || "");
            setLocation(listing.location || "");
        } else {
            setEditingId(null);
            setCategory("");
            setCustomCategory("");
            setTitle("");
            setDescription("");
            setPhoneNumber("");
            setExperience("");
            setLocation("");
        }
        onOpen();
    };

    const handleClose = () => {
        setEditingId(null);
        onClose();
    };

    // ─── Filtered listings ───────────────────────────────────
    const filtered = listings.filter((l) => {
        if (filterCategory !== "all" && l.category !== filterCategory) return false;
        if (search) {
            const s = search.toLowerCase();
            return (
                l.title.toLowerCase().includes(s) ||
                l.category.toLowerCase().includes(s) ||
                l.player?.displayName?.toLowerCase().includes(s) ||
                l.player?.user.username.toLowerCase().includes(s)
            );
        }
        return true;
    });

    const displayCategory = (l: JobListing) =>
        l.category === "Other" ? l.customCategory || "Other" : l.category;

    return (
        <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
            {/* Header */}
            <div className="mb-5 flex items-center justify-between">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <Briefcase className="h-5 w-5 text-primary" />
                        <h1 className="text-lg font-bold">Jobs</h1>
                    </div>
                    <p className="text-sm text-foreground/50">
                        Community services & listings
                    </p>
                </div>
                {isSignedIn && !myListing && (
                    <Button
                        size="sm"
                        color="primary"
                        startContent={<Plus className="h-3.5 w-3.5" />}
                        onPress={() => handleOpen()}
                    >
                        Post
                    </Button>
                )}
            </div>

            {/* My Listing */}
            {myListing && (
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-5"
                >
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-foreground/40">
                        Your Listing
                    </p>
                    <Card className="border-2 border-primary/20 bg-primary/[0.02]">
                        <CardBody className="p-3">
                            <div className="flex items-start justify-between">
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-semibold">{myListing.title}</p>
                                    <Chip size="sm" variant="flat" className="mt-1">
                                        {displayCategory(myListing)}
                                    </Chip>
                                    {myListing.description && (
                                        <p className="mt-1 text-xs text-foreground/50 line-clamp-2">
                                            {myListing.description}
                                        </p>
                                    )}
                                </div>
                                <div className="flex gap-1 shrink-0">
                                    <Button
                                        isIconOnly
                                        size="sm"
                                        variant="light"
                                        onPress={() => handleOpen(myListing)}
                                    >
                                        <Pencil className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button
                                        isIconOnly
                                        size="sm"
                                        variant="light"
                                        color="danger"
                                        onPress={() => {
                                            if (confirm("Delete your listing?"))
                                                deleteListing.mutate(myListing.id);
                                        }}
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            </div>
                        </CardBody>
                    </Card>
                </motion.div>
            )}

            {/* Search & Filter */}
            <div className="mb-4 flex gap-2">
                <Input
                    size="sm"
                    placeholder="Search jobs..."
                    value={search}
                    onValueChange={setSearch}
                    startContent={<Search className="h-3.5 w-3.5 text-foreground/30" />}
                    className="flex-1"
                />
                <Select
                    size="sm"
                    placeholder="Category"
                    selectedKeys={[filterCategory]}
                    onSelectionChange={(keys) => {
                        const val = Array.from(keys)[0] as string;
                        setFilterCategory(val || "all");
                    }}
                    className="w-36"
                >
                    <SelectItem key="all">All</SelectItem>
                    {JOB_CATEGORIES.map((c) => (
                        <SelectItem key={c}>{c}</SelectItem>
                    ))}
                </Select>
            </div>

            {/* Listings */}
            <div className="space-y-2">
                {isLoading &&
                    [1, 2, 3, 4].map((i) => (
                        <Skeleton key={i} className="h-24 w-full rounded-xl" />
                    ))}

                {!isLoading && filtered.length === 0 && (
                    <Card className="border border-divider">
                        <CardBody className="flex flex-col items-center gap-3 py-12">
                            <Briefcase className="h-10 w-10 text-foreground/15" />
                            <p className="text-sm text-foreground/40">
                                {search || filterCategory !== "all"
                                    ? "No listings match your search"
                                    : "No job listings yet"}
                            </p>
                        </CardBody>
                    </Card>
                )}

                {filtered.map((listing, i) => (
                    <motion.div
                        key={listing.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.03 }}
                    >
                        <Card className="border border-divider">
                            <CardBody className="p-3">
                                <div className="flex items-start gap-3">
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                            <p className="text-sm font-semibold truncate">
                                                {listing.title}
                                            </p>
                                            <Chip size="sm" variant="flat" className="shrink-0">
                                                {displayCategory(listing)}
                                            </Chip>
                                        </div>
                                        <p className="mt-0.5 text-xs text-foreground/50">
                                            {listing.player?.displayName ||
                                                listing.player?.user.username}
                                        </p>
                                        {listing.description && (
                                            <p className="mt-1 text-xs text-foreground/60 line-clamp-2">
                                                {listing.description}
                                            </p>
                                        )}
                                        <div className="mt-2 flex flex-wrap items-center gap-3">
                                            {listing.location && (
                                                <span className="flex items-center gap-1 text-[11px] text-foreground/40">
                                                    <MapPin className="h-3 w-3" />
                                                    {listing.location}
                                                </span>
                                            )}
                                            {listing.experience && (
                                                <span className="flex items-center gap-1 text-[11px] text-foreground/40">
                                                    <Clock className="h-3 w-3" />
                                                    {EXPERIENCE_OPTIONS.find(
                                                        (o) => o.value === listing.experience
                                                    )?.label || listing.experience}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    {/* Actions */}
                                    <div className="flex flex-col items-end gap-2 shrink-0">
                                        <a
                                            href={`tel:${listing.phoneNumber}`}
                                            className="flex items-center gap-1 rounded-full bg-success px-3 py-1.5 text-[11px] font-medium text-white"
                                        >
                                            <Phone className="h-3 w-3" />
                                            Call
                                        </a>
                                        <div className="flex items-center gap-1.5">
                                            <button
                                                onClick={() =>
                                                    reactToListing.mutate({
                                                        id: listing.id,
                                                        reactionType: "like",
                                                    })
                                                }
                                                className={`flex items-center gap-1 rounded-full px-2 py-1 text-[11px] transition-colors ${listing.userReaction === "like"
                                                        ? "bg-success/20 text-success"
                                                        : "bg-foreground/5 text-foreground/40 hover:bg-success/10"
                                                    }`}
                                            >
                                                <ThumbsUp
                                                    className="h-3 w-3"
                                                    fill={
                                                        listing.userReaction === "like"
                                                            ? "currentColor"
                                                            : "none"
                                                    }
                                                />
                                                {listing.likeCount}
                                            </button>
                                            <button
                                                onClick={() =>
                                                    reactToListing.mutate({
                                                        id: listing.id,
                                                        reactionType: "dislike",
                                                    })
                                                }
                                                className={`flex items-center gap-1 rounded-full px-2 py-1 text-[11px] transition-colors ${listing.userReaction === "dislike"
                                                        ? "bg-danger/20 text-danger"
                                                        : "bg-foreground/5 text-foreground/40 hover:bg-danger/10"
                                                    }`}
                                            >
                                                <ThumbsDown
                                                    className="h-3 w-3"
                                                    fill={
                                                        listing.userReaction === "dislike"
                                                            ? "currentColor"
                                                            : "none"
                                                    }
                                                />
                                                {listing.dislikeCount}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </CardBody>
                        </Card>
                    </motion.div>
                ))}
            </div>

            {/* Create/Edit Modal */}
            <Modal isOpen={isOpen} onClose={handleClose} placement="center" size="lg" scrollBehavior="inside">
                <ModalContent>
                    <ModalHeader>
                        {editingId ? "Edit Listing" : "Post a Job"}
                    </ModalHeader>
                    <ModalBody className="gap-3">
                        <Select
                            label="Category"
                            placeholder="Select category"
                            selectedKeys={category ? [category] : []}
                            onSelectionChange={(keys) =>
                                setCategory(Array.from(keys)[0] as string)
                            }
                            isRequired
                        >
                            {JOB_CATEGORIES.map((c) => (
                                <SelectItem key={c}>{c}</SelectItem>
                            ))}
                        </Select>
                        {category === "Other" && (
                            <Input
                                label="Custom Category"
                                placeholder="Enter your category"
                                value={customCategory}
                                onValueChange={setCustomCategory}
                                isRequired
                            />
                        )}
                        <Input
                            label="Title"
                            placeholder="e.g. House Painter Available"
                            value={title}
                            onValueChange={setTitle}
                            maxLength={50}
                            isRequired
                        />
                        <Textarea
                            label="Description"
                            placeholder="Describe your services..."
                            value={description}
                            onValueChange={setDescription}
                            maxLength={150}
                            minRows={2}
                        />
                        <Input
                            label="Phone Number"
                            placeholder="Enter phone number"
                            value={phoneNumber}
                            onValueChange={setPhoneNumber}
                            type="tel"
                            isRequired
                        />
                        <Select
                            label="Experience"
                            placeholder="Select experience"
                            selectedKeys={experience ? [experience] : []}
                            onSelectionChange={(keys) =>
                                setExperience(Array.from(keys)[0] as string || "")
                            }
                        >
                            {EXPERIENCE_OPTIONS.map((o) => (
                                <SelectItem key={o.value}>{o.label}</SelectItem>
                            ))}
                        </Select>
                        <Input
                            label="Location"
                            placeholder="e.g. Shillong, Meghalaya"
                            value={location}
                            onValueChange={setLocation}
                            maxLength={50}
                        />
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="flat" onPress={handleClose}>
                            Cancel
                        </Button>
                        <Button
                            color="primary"
                            isLoading={saveListing.isPending}
                            isDisabled={
                                !category || !title.trim() || !phoneNumber.trim() ||
                                (category === "Other" && !customCategory.trim())
                            }
                            onPress={() => saveListing.mutate()}
                        >
                            {editingId ? "Save" : "Post"}
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </div>
    );
}
