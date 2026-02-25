"use client";

import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    Card,
    CardBody,
    Chip,
    Skeleton,
} from "@heroui/react";
import {
    Briefcase,
    Phone,
    MapPin,
    ThumbsUp,
    ThumbsDown,
    Clock,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import Link from "next/link";

/* ─── Types ─────────────────────────────────────────────────── */

interface JobListing {
    id: string;
    playerId: string;
    category: string;
    customCategory: string | null;
    title: string;
    description: string | null;
    phoneNumber: string;
    experience: string | null;
    location: string | null;
    likeCount: number;
    dislikeCount: number;
    player?: {
        id: string;
        displayName: string | null;
        user: { username: string };
    };
    userReaction?: "like" | "dislike" | null;
}

const EXPERIENCE_OPTIONS: Record<string, string> = {
    "1_MONTH": "1 Month",
    "6_MONTHS": "6 Months",
    "1_YEAR": "1 Year",
    "2_YEARS": "2 Years",
    "3_YEARS_PLUS": "3+ Years",
};

const AUTO_ROTATE_MS = 5000;

/* ─── Component ─────────────────────────────────────────────── */

export function VotePageJobListings() {
    const queryClient = useQueryClient();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [direction, setDirection] = useState(1); // 1 = right, -1 = left

    const { data: listings = [], isLoading } = useQuery<JobListing[]>({
        queryKey: ["job-listings"],
        queryFn: async () => {
            const res = await fetch("/api/job-listings");
            if (!res.ok) throw new Error("Failed");
            const json = await res.json();
            return json.data;
        },
        staleTime: 60 * 1000,
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

    // Auto-rotate carousel
    useEffect(() => {
        if (listings.length <= 1) return;
        const timer = setInterval(() => {
            setDirection(1);
            setCurrentIndex((prev) => (prev + 1) % listings.length);
        }, AUTO_ROTATE_MS);
        return () => clearInterval(timer);
    }, [listings.length]);

    // Keep index in bounds
    useEffect(() => {
        if (listings.length > 0 && currentIndex >= listings.length) {
            setCurrentIndex(0);
        }
    }, [listings.length, currentIndex]);

    const goNext = useCallback(() => {
        setDirection(1);
        setCurrentIndex((prev) => (prev + 1) % listings.length);
    }, [listings.length]);

    const goPrev = useCallback(() => {
        setDirection(-1);
        setCurrentIndex((prev) => (prev - 1 + listings.length) % listings.length);
    }, [listings.length]);

    const displayCategory = (l: JobListing) =>
        l.category === "Other" ? l.customCategory || "Other" : l.category;

    if (isLoading) {
        return (
            <div className="space-y-3">
                <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4 rounded" />
                    <Skeleton className="h-5 w-32 rounded" />
                </div>
                <Skeleton className="h-24 w-full rounded-xl" />
            </div>
        );
    }

    if (listings.length === 0) return null;

    const listing = listings[currentIndex];
    if (!listing) return null;

    return (
        <div className="space-y-3">
            {/* Section Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-foreground/40" />
                    <h2 className="text-sm font-semibold text-foreground/70">
                        Community Jobs
                    </h2>
                    <Chip size="sm" variant="flat" className="h-5 text-[10px]">
                        {listings.length}
                    </Chip>
                </div>
                <Link
                    href="/jobs"
                    className="text-[11px] font-medium text-primary hover:underline"
                >
                    View All →
                </Link>
            </div>

            {/* Single Card Carousel */}
            <div className="relative overflow-hidden rounded-xl">
                <AnimatePresence mode="popLayout" custom={direction}>
                    <motion.div
                        key={listing.id}
                        custom={direction}
                        initial={{ opacity: 0, x: direction * 60 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: direction * -60 }}
                        transition={{ duration: 0.25, ease: "easeInOut" }}
                    >
                        <Card className="border border-divider">
                            <CardBody className="p-3">
                                <div className="flex items-start gap-2.5">
                                    <div className="min-w-0 flex-1">
                                        {/* Title — full, no truncation */}
                                        <div className="flex items-start gap-1.5 flex-wrap">
                                            <p className="text-[13px] font-semibold leading-snug">
                                                {listing.title}
                                            </p>
                                            <Chip
                                                size="sm"
                                                variant="flat"
                                                className="h-4 text-[9px] shrink-0"
                                            >
                                                {displayCategory(listing)}
                                            </Chip>
                                        </div>
                                        <p className="text-[11px] text-foreground/45 mt-0.5">
                                            {listing.player?.displayName ||
                                                listing.player?.user.username}
                                        </p>
                                        <div className="mt-1.5 flex flex-wrap items-center gap-2.5">
                                            {listing.location && (
                                                <span className="flex items-center gap-0.5 text-[10px] text-foreground/35">
                                                    <MapPin className="h-2.5 w-2.5" />
                                                    {listing.location}
                                                </span>
                                            )}
                                            {listing.experience && (
                                                <span className="flex items-center gap-0.5 text-[10px] text-foreground/35">
                                                    <Clock className="h-2.5 w-2.5" />
                                                    {EXPERIENCE_OPTIONS[listing.experience] || listing.experience}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                                        <a
                                            href={`tel:${listing.phoneNumber}`}
                                            className="flex items-center gap-1 rounded-full bg-success/90 px-2.5 py-1 text-[10px] font-medium text-white"
                                        >
                                            <Phone className="h-2.5 w-2.5" />
                                            Call
                                        </a>
                                        <div className="flex items-center gap-1">
                                            {/* Like button with count */}
                                            <button
                                                onClick={() =>
                                                    reactToListing.mutate({
                                                        id: listing.id,
                                                        reactionType: "like",
                                                    })
                                                }
                                                className={`flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] transition-colors ${listing.userReaction === "like"
                                                        ? "bg-success/20 text-success"
                                                        : "bg-foreground/5 text-foreground/35 hover:bg-success/10"
                                                    }`}
                                            >
                                                <ThumbsUp
                                                    className="h-2.5 w-2.5"
                                                    fill={listing.userReaction === "like" ? "currentColor" : "none"}
                                                />
                                                {listing.likeCount}
                                            </button>
                                            {/* Dislike button — no counter shown */}
                                            <button
                                                onClick={() =>
                                                    reactToListing.mutate({
                                                        id: listing.id,
                                                        reactionType: "dislike",
                                                    })
                                                }
                                                className={`flex items-center rounded-full p-1 text-[10px] transition-colors ${listing.userReaction === "dislike"
                                                        ? "bg-danger/20 text-danger"
                                                        : "bg-foreground/5 text-foreground/35 hover:bg-danger/10"
                                                    }`}
                                            >
                                                <ThumbsDown
                                                    className="h-2.5 w-2.5"
                                                    fill={listing.userReaction === "dislike" ? "currentColor" : "none"}
                                                />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </CardBody>
                        </Card>
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Navigation Dots + Arrows */}
            {listings.length > 1 && (
                <div className="flex items-center justify-center gap-3">
                    <button
                        onClick={goPrev}
                        className="rounded-full p-1 text-foreground/30 hover:text-foreground/60 hover:bg-foreground/5 transition-colors"
                    >
                        <ChevronLeft className="h-3.5 w-3.5" />
                    </button>
                    <div className="flex items-center gap-1.5">
                        {listings.map((_, i) => (
                            <button
                                key={i}
                                onClick={() => {
                                    setDirection(i > currentIndex ? 1 : -1);
                                    setCurrentIndex(i);
                                }}
                                className={`h-1.5 rounded-full transition-all duration-200 ${i === currentIndex
                                        ? "w-4 bg-primary"
                                        : "w-1.5 bg-foreground/15 hover:bg-foreground/25"
                                    }`}
                            />
                        ))}
                    </div>
                    <button
                        onClick={goNext}
                        className="rounded-full p-1 text-foreground/30 hover:text-foreground/60 hover:bg-foreground/5 transition-colors"
                    >
                        <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                </div>
            )}
        </div>
    );
}
