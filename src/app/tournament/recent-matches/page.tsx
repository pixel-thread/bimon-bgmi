"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FiImage, FiX, FiChevronLeft, FiChevronRight, FiChevronDown } from "react-icons/fi";
import http from "@/src/utils/http";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import { CardStack } from "@/src/components/ui/card-stack";

type RecentMatchImage = {
    id: string;
    matchNumber: number;
    imageUrl: string;
};

type RecentMatchGroup = {
    id: string;
    tournamentTitle: string;
    createdAt: string;
    images: RecentMatchImage[];
};

const RecentMatchesPage = () => {
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [carouselIndex, setCarouselIndex] = useState(0);
    const [carouselImages, setCarouselImages] = useState<string[]>([]);
    const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
    const [zoomLevel, setZoomLevel] = useState(1);

    const { data: groups, isLoading } = useQuery({
        queryKey: ["recent-matches-public"],
        queryFn: () => http.get<RecentMatchGroup[]>("/recent-matches"),
        select: (data) => data.data,
    });

    // Group images by match number
    const groupImagesByMatch = (images: RecentMatchImage[]) => {
        const grouped: Record<number, RecentMatchImage[]> = {};
        images.forEach((img) => {
            if (!grouped[img.matchNumber]) {
                grouped[img.matchNumber] = [];
            }
            grouped[img.matchNumber].push(img);
        });
        return Object.entries(grouped).sort(([a], [b]) => Number(a) - Number(b));
    };

    const openCarousel = (images: RecentMatchImage[], startIndex: number) => {
        setCarouselImages(images.map((img) => img.imageUrl));
        setCarouselIndex(startIndex);
        setSelectedImage(images[startIndex].imageUrl);
    };

    const closeCarousel = () => {
        setSelectedImage(null);
        setCarouselImages([]);
        setCarouselIndex(0);
        setZoomLevel(1);
    };

    const nextImage = () => {
        const next = (carouselIndex + 1) % carouselImages.length;
        setCarouselIndex(next);
        setSelectedImage(carouselImages[next]);
    };

    const prevImage = () => {
        const prev = (carouselIndex - 1 + carouselImages.length) % carouselImages.length;
        setCarouselIndex(prev);
        setSelectedImage(carouselImages[prev]);
        setZoomLevel(1);
    };

    const handleImageDoubleClick = () => {
        setZoomLevel(prev => prev === 1 ? 2 : 1);
    };

    // Preload images for faster lightbox opening
    const preloadImages = (images: RecentMatchImage[]) => {
        images.forEach((img) => {
            const image = new window.Image();
            image.src = img.imageUrl;
        });
    };

    const toggleGroup = (groupId: string) => {
        const newExpanded = expandedGroup === groupId ? null : groupId;
        setExpandedGroup(newExpanded);

        // Preload images when expanding
        if (newExpanded) {
            const group = groups?.find(g => g.id === newExpanded);
            if (group) {
                preloadImages(group.images);
            }
        }
    };

    // Prepare cards for CardStack - take first 4 images from different matches
    const getStackCards = (images: RecentMatchImage[]) => {
        const matchGroups = groupImagesByMatch(images);
        const cards: { id: number; imageUrl: string; matchNumber: number }[] = [];

        matchGroups.slice(0, 4).forEach(([matchNumber, matchImages], idx) => {
            if (matchImages[0]) {
                cards.push({
                    id: idx,
                    imageUrl: matchImages[0].imageUrl,
                    matchNumber: parseInt(matchNumber),
                });
            }
        });
        return cards;
    };

    return (
        <div className="space-y-6">
            {/* Content */}
            {isLoading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                </div>
            ) : !groups || groups.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="p-4 bg-slate-200 dark:bg-slate-700 rounded-full mb-4">
                        <FiImage className="h-10 w-10 text-slate-400 dark:text-slate-500" />
                    </div>
                    <h3 className="text-xl font-medium text-slate-700 dark:text-slate-300">
                        No recent matches available
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400 mt-2">
                        Check back after tournaments are completed.
                    </p>
                </div>
            ) : (
                <div className="grid gap-8 md:grid-cols-2">
                    {groups.map((group) => {
                        const matchCount = new Set(group.images.map(img => img.matchNumber)).size;
                        const isExpanded = expandedGroup === group.id;
                        const stackCards = getStackCards(group.images);

                        return (
                            <div
                                key={group.id}
                                className={`bg-white dark:bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-lg overflow-hidden border border-slate-200 dark:border-slate-700 transition-all ${isExpanded ? 'md:col-span-2' : ''}`}
                            >
                                {/* Compact Card View */}
                                <div
                                    className="p-5 cursor-pointer group"
                                    onClick={() => toggleGroup(group.id)}
                                >
                                    <div className="flex gap-5">
                                        {/* CardStack Thumbnail - only show when collapsed */}
                                        {!isExpanded && (
                                            <div className="w-44 h-24 relative flex-shrink-0">
                                                {stackCards.length > 0 && (
                                                    <CardStack items={stackCards} offset={5} scaleFactor={0.04} />
                                                )}
                                            </div>
                                        )}

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <h2 className="text-lg font-bold text-slate-800 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                                {group.tournamentTitle}
                                            </h2>
                                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                                {matchCount} match{matchCount !== 1 ? 'es' : ''} • {group.images.length} image{group.images.length !== 1 ? 's' : ''}
                                            </p>
                                            <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
                                                {new Date(group.createdAt).toLocaleDateString("en-US", {
                                                    month: "short",
                                                    day: "numeric",
                                                    year: "numeric",
                                                })}
                                            </p>
                                        </div>

                                        {/* Expand Arrow */}
                                        <div className="flex items-center text-slate-400 group-hover:text-indigo-500 transition-colors">
                                            <FiChevronDown className={`h-5 w-5 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                                        </div>
                                    </div>
                                </div>

                                {/* Expanded View - Images */}
                                {isExpanded && (
                                    <div className="border-t border-slate-200 dark:border-slate-700 p-4 md:p-6 space-y-6">
                                        {groupImagesByMatch(group.images).map(
                                            ([matchNumber, matchImages]) => (
                                                <div key={matchNumber}>
                                                    <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                                                        <span className="bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 px-3 py-1 rounded-full text-sm">
                                                            Match {matchNumber}
                                                        </span>
                                                    </h3>

                                                    {/* Images Grid */}
                                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                                        {matchImages.map((img, idx) => (
                                                            <div
                                                                key={img.id}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    openCarousel(matchImages, idx);
                                                                }}
                                                                className="relative aspect-video rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 cursor-pointer group hover:ring-2 hover:ring-indigo-500 transition-all"
                                                            >
                                                                <Image
                                                                    src={img.imageUrl}
                                                                    alt={`Match ${matchNumber} - Image ${idx + 1}`}
                                                                    fill
                                                                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                                                                />
                                                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Lightbox/Carousel Modal */}
            {selectedImage && (
                <div
                    className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
                    onClick={closeCarousel}
                >
                    {/* Close button */}
                    <button
                        onClick={closeCarousel}
                        className="absolute top-4 right-4 p-2 text-white/70 hover:text-white z-10"
                    >
                        <FiX className="h-8 w-8" />
                    </button>

                    {/* Navigation */}
                    {carouselImages.length > 1 && (
                        <>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    prevImage();
                                }}
                                className="absolute left-4 p-3 text-white/70 hover:text-white bg-black/30 rounded-full z-10"
                            >
                                <FiChevronLeft className="h-6 w-6" />
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    nextImage();
                                }}
                                className="absolute right-4 p-3 text-white/70 hover:text-white bg-black/30 rounded-full z-10"
                            >
                                <FiChevronRight className="h-6 w-6" />
                            </button>
                        </>
                    )}

                    {/* Image - double-click/tap to zoom, click outside closes */}
                    <div
                        className="relative max-w-4xl max-h-[80vh] w-auto h-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div
                            className="relative transition-transform duration-300 ease-out cursor-zoom-in"
                            style={{ transform: `scale(${zoomLevel})` }}
                            onDoubleClick={handleImageDoubleClick}
                        >
                            <img
                                src={selectedImage}
                                alt="Scoreboard"
                                className="max-w-[90vw] max-h-[80vh] object-contain"
                            />
                        </div>
                    </div>

                    {/* Indicators */}
                    {carouselImages.length > 1 && (
                        <div className="absolute bottom-32 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                            {carouselImages.map((_, idx) => (
                                <button
                                    key={idx}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setCarouselIndex(idx);
                                        setSelectedImage(carouselImages[idx]);
                                    }}
                                    className={`w-2 h-2 rounded-full transition-all ${idx === carouselIndex
                                        ? "bg-white w-4"
                                        : "bg-white/50 hover:bg-white/70"
                                        }`}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default RecentMatchesPage;
