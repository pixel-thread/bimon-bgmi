"use client";

import { useQuery } from "@tanstack/react-query";
import {
    Card,
    CardBody,
    Skeleton,
    Chip,
} from "@heroui/react";
import {
    Image as ImageIcon,
    AlertCircle,
    Film,
    Star,
} from "lucide-react";
import { motion } from "motion/react";

interface GalleryItem {
    id: string;
    name: string;
    publicUrl: string;
    isCharacterImg: boolean;
    isAnimated: boolean;
    isVideo: boolean;
    status: string;
}

/**
 * /dashboard/gallery — Admin gallery viewer.
 * Shows all gallery items (character images, backgrounds).
 */
export default function GalleryPage() {
    const { data, isLoading, error } = useQuery<GalleryItem[]>({
        queryKey: ["gallery"],
        queryFn: async () => {
            const res = await fetch("/api/gallery");
            if (!res.ok) throw new Error("Failed");
            const json = await res.json();
            return json.data;
        },
        staleTime: 60 * 1000,
    });

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-xl font-bold">Gallery</h1>
                <p className="text-sm text-foreground/50">
                    Character images and backgrounds
                </p>
            </div>

            {error && (
                <div className="flex items-center gap-2 rounded-lg bg-danger-50 p-4 text-sm text-danger dark:bg-danger-50/10">
                    <AlertCircle className="h-4 w-4" />
                    Failed to load gallery.
                </div>
            )}

            {isLoading && (
                <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                        <Skeleton key={i} className="aspect-square rounded-xl" />
                    ))}
                </div>
            )}

            {data && (
                <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
                    {data.length === 0 ? (
                        <div className="col-span-full flex flex-col items-center gap-3 rounded-xl bg-default-100 py-12 text-center">
                            <ImageIcon className="h-10 w-10 text-foreground/20" />
                            <p className="text-sm text-foreground/50">No gallery items</p>
                        </div>
                    ) : (
                        data.map((item, i) => (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: i * 0.02 }}
                            >
                                <Card className="group border border-divider">
                                    <CardBody className="p-0">
                                        {/* Media */}
                                        <div className="relative aspect-square overflow-hidden rounded-t-xl bg-default-100">
                                            {item.isVideo ? (
                                                <video
                                                    src={item.publicUrl}
                                                    muted
                                                    loop
                                                    playsInline
                                                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                                                    onMouseEnter={(e) =>
                                                        (e.target as HTMLVideoElement).play()
                                                    }
                                                    onMouseLeave={(e) =>
                                                        (e.target as HTMLVideoElement).pause()
                                                    }
                                                />
                                            ) : (
                                                <img
                                                    src={item.publicUrl}
                                                    alt={item.name}
                                                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                                                    loading="lazy"
                                                />
                                            )}

                                            {/* Badges */}
                                            <div className="absolute right-1.5 top-1.5 flex gap-1">
                                                {item.isCharacterImg && (
                                                    <Chip
                                                        size="sm"
                                                        variant="flat"
                                                        color="primary"
                                                        startContent={<Star className="h-3 w-3" />}
                                                    >
                                                        Character
                                                    </Chip>
                                                )}
                                                {item.isVideo && (
                                                    <Chip
                                                        size="sm"
                                                        variant="flat"
                                                        color="secondary"
                                                        startContent={<Film className="h-3 w-3" />}
                                                    >
                                                        Video
                                                    </Chip>
                                                )}
                                                {item.isAnimated && !item.isVideo && (
                                                    <Chip size="sm" variant="flat" color="warning">
                                                        GIF
                                                    </Chip>
                                                )}
                                            </div>
                                        </div>

                                        {/* Name */}
                                        <div className="px-3 py-2">
                                            <p className="truncate text-xs font-medium">
                                                {item.name}
                                            </p>
                                        </div>
                                    </CardBody>
                                </Card>
                            </motion.div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
