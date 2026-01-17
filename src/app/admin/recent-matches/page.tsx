"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { FiUpload, FiTrash2, FiImage, FiX, FiEdit, FiScissors, FiEye } from "react-icons/fi";
import { cropImagesRightHalf } from "@/src/utils/image/cropImage";
import { Button } from "@/src/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/src/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/src/components/ui/dialog";
import http from "@/src/utils/http";
import { useAuth } from "@/src/hooks/context/auth/useAuth";
import { Loader2 } from "lucide-react";
import Image from "next/image";

type Tournament = {
    id: string;
    name: string;
    createdAt: string;
    _count?: { matches: number };
};

type RecentMatchImage = {
    id: string;
    matchNumber: number;
    imageUrl: string;
};

type RecentMatchGroup = {
    id: string;
    tournamentId: string;
    tournamentTitle: string;
    createdAt: string;
    images: RecentMatchImage[];
};

const AdminRecentMatchesPage = () => {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [selectedTournament, setSelectedTournament] = useState<string>("");
    const [editingGroup, setEditingGroup] = useState<RecentMatchGroup | null>(null);
    const [selectedMatchNumber, setSelectedMatchNumber] = useState<number>(1);
    const [uploadFiles, setUploadFiles] = useState<File[]>([]);
    const [cropRightHalf, setCropRightHalf] = useState(true); // Default ON for scoreboards
    const [croppedPreviews, setCroppedPreviews] = useState<string[]>([]); // For preview of cropped images
    const [croppedFiles, setCroppedFiles] = useState<File[]>([]); // The actual cropped files for upload
    const [dragIndex, setDragIndex] = useState<number | null>(null);
    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const [previewImages, setPreviewImages] = useState<string[]>([]); // For post-upload preview
    const [previewTitle, setPreviewTitle] = useState(""); // Dynamic title for preview modal
    const [expandedTournament, setExpandedTournament] = useState<string | null>(null); // For viewing matches

    // Auto-select latest match number when tournament changes
    const handleTournamentChange = (tournamentId: string) => {
        setSelectedTournament(tournamentId);

        // Find existing group for this tournament and calculate next match number
        const existingGroup = groups?.find(g => g.tournamentId === tournamentId);
        if (existingGroup && existingGroup.images.length > 0) {
            const maxMatch = Math.max(...existingGroup.images.map(img => img.matchNumber));
            setSelectedMatchNumber(maxMatch + 1);
        } else {
            setSelectedMatchNumber(1);
        }
        setUploadFiles([]);
    };

    // Fetch all tournaments for dropdown (with match count)
    const { data: tournaments, isLoading: tournamentsLoading } = useQuery({
        queryKey: ["tournaments-with-matches"],
        queryFn: () => http.get<Tournament[]>("/admin/tournament"),
        select: (data) => {
            if (!data.data) return [];
            // Filter to only show tournaments from the last week
            const oneWeekAgo = new Date();
            oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
            return data.data.filter(t => new Date(t.createdAt) >= oneWeekAgo);
        },
    });

    // Fetch matches for selected tournament
    const { data: tournamentMatches } = useQuery({
        queryKey: ["tournament-matches", selectedTournament],
        queryFn: () => http.get<{ id: string; matchNumber?: number }[]>(
            `/admin/tournament/${selectedTournament}/match`
        ),
        select: (data) => data.data,
        enabled: !!selectedTournament,
    });

    // Fetch existing scoreboard groups
    const { data: groups, isLoading: groupsLoading } = useQuery({
        queryKey: ["recent-matches"],
        queryFn: () => http.get<RecentMatchGroup[]>("/admin/recent-matches"),
        select: (data) => data.data,
    });

    // Upload mutation
    const uploadMutation = useMutation({
        mutationFn: async () => {
            const formData = new FormData();
            formData.append("tournamentId", selectedTournament);

            // Use pre-cropped files if available (already reordered by user)
            // Otherwise use original files
            let filesToUpload = uploadFiles;
            if (cropRightHalf && croppedFiles.length > 0) {
                filesToUpload = croppedFiles;
            } else if (cropRightHalf) {
                try {
                    filesToUpload = await cropImagesRightHalf(uploadFiles);
                } catch (error) {
                    console.error("Crop failed, using original images:", error);
                }
            }

            filesToUpload.forEach((file, idx) => {
                formData.append(`match_${selectedMatchNumber}_${idx}`, file);
            });

            return http.post("/admin/recent-matches", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
        },
        onSuccess: () => {
            toast.success("Scoreboards uploaded successfully!");
            queryClient.invalidateQueries({ queryKey: ["recent-matches"] });

            // Save preview URLs before resetting (don't revoke them yet)
            if (croppedPreviews.length > 0) {
                setPreviewImages([...croppedPreviews]);
                setShowPreviewModal(true);
            }

            // Reset form but don't revoke preview URLs yet
            setSelectedTournament("");
            setEditingGroup(null);
            setSelectedMatchNumber(1);
            setUploadFiles([]);
            setCroppedPreviews([]);
            setCroppedFiles([]);
            setDragIndex(null);
            setShowUploadModal(false);
        },
        onError: () => {
            toast.error("Failed to upload scoreboards");
        },
    });

    // Delete group mutation
    const deleteMutation = useMutation({
        mutationFn: (id: string) => http.delete(`/admin/recent-matches/${id}`),
        onSuccess: () => {
            toast.success("Scoreboard group deleted");
            queryClient.invalidateQueries({ queryKey: ["recent-matches"] });
        },
        onError: () => {
            toast.error("Failed to delete");
        },
    });

    // Delete individual image mutation
    const deleteImageMutation = useMutation({
        mutationFn: ({ groupId, imageId }: { groupId: string; imageId: string }) =>
            http.delete(`/admin/recent-matches/${groupId}/image/${imageId}`),
        onSuccess: (_, variables) => {
            toast.success("Image deleted");
            queryClient.invalidateQueries({ queryKey: ["recent-matches"] });
            // Update local editingGroup state to reflect deletion
            if (editingGroup) {
                setEditingGroup({
                    ...editingGroup,
                    images: editingGroup.images.filter(img => img.id !== variables.imageId)
                });
            }
        },
        onError: () => {
            toast.error("Failed to delete image");
        },
    });

    const resetForm = () => {
        setSelectedTournament("");
        setEditingGroup(null);
        setSelectedMatchNumber(1);
        setUploadFiles([]);
        // Cleanup cropped preview URLs and files
        croppedPreviews.forEach(url => URL.revokeObjectURL(url));
        setCroppedPreviews([]);
        setCroppedFiles([]);
        setDragIndex(null);
    };

    // Open edit modal for a group
    const openEditModal = (group: RecentMatchGroup) => {
        setEditingGroup(group);
        setSelectedTournament(group.tournamentId);
        setSelectedMatchNumber(1); // Default to Match 1
        setUploadFiles([]);
        setShowUploadModal(true);
    };

    // Get available match numbers for dropdown (based on tournament's actual matches)
    const getMatchOptions = () => {
        // Use actual match count from tournament
        const matchCount = tournamentMatches?.length || 0;
        if (matchCount === 0) {
            return [1, 2, 3, 4]; // Default if no matches yet
        }
        return Array.from({ length: matchCount }, (_, i) => i + 1);
    };

    const handleFileChange = async (files: FileList | null) => {
        if (!files) return;
        const newFiles = Array.from(files);
        const allFiles = [...uploadFiles, ...newFiles];
        setUploadFiles(allFiles);

        // Generate cropped previews if crop mode is enabled
        // This generates all previews from scratch since cropping produces N+1 images
        if (cropRightHalf && allFiles.length > 0) {
            try {
                // Clear old previews first
                croppedPreviews.forEach(url => URL.revokeObjectURL(url));

                const cropped = await cropImagesRightHalf(allFiles);
                const urls = cropped.map(f => URL.createObjectURL(f));
                setCroppedPreviews(urls);
                setCroppedFiles(cropped); // Store cropped files for upload
            } catch {
                // If crop fails, just use original previews
                setCroppedPreviews([]);
                setCroppedFiles([]);
            }
        }
    };

    // Drag-and-drop reorder handler
    const handleDrop = (dropIndex: number) => {
        if (dragIndex === null || dragIndex === dropIndex) return;

        // Reorder both previews and files
        const newPreviews = [...croppedPreviews];
        const newFiles = [...croppedFiles];

        // Remove dragged item and insert at drop position
        const [draggedPreview] = newPreviews.splice(dragIndex, 1);
        const [draggedFile] = newFiles.splice(dragIndex, 1);

        newPreviews.splice(dropIndex, 0, draggedPreview);
        newFiles.splice(dropIndex, 0, draggedFile);

        setCroppedPreviews(newPreviews);
        setCroppedFiles(newFiles);
        setDragIndex(null);
    };

    const removeFile = (fileIndex: number) => {
        setUploadFiles(uploadFiles.filter((_, i) => i !== fileIndex));
        // Also remove cropped preview
        if (croppedPreviews[fileIndex]) {
            URL.revokeObjectURL(croppedPreviews[fileIndex]);
            setCroppedPreviews(prev => prev.filter((_, i) => i !== fileIndex));
        }
    };

    const canSubmit = selectedTournament && uploadFiles.length > 0;

    // Group images by match number for display
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

    // Get match count for a tournament
    const getMatchCountForTournament = (tournamentId: string) => {
        const group = groups?.find(g => g.tournamentId === tournamentId);
        if (!group) return 0;
        const matchNumbers = new Set(group.images.map(img => img.matchNumber));
        return matchNumbers.size;
    };

    // Open upload modal with latest tournament auto-selected
    const openUploadModal = () => {
        if (tournaments && tournaments.length > 0) {
            // Auto-select the first (latest) tournament
            const latestTournament = tournaments[0];
            handleTournamentChange(latestTournament.id);
        }
        setShowUploadModal(true);
    };

    return (
        <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
            <div className="max-w-7xl mx-auto space-y-6">
                <header className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-3 text-slate-800 dark:text-foreground">
                            <FiImage className="h-8 w-8 text-indigo-600" />
                            Recent Match Scoreboards
                        </h1>
                        <p className="mt-2 text-sm text-slate-500 dark:text-muted-foreground">
                            Upload scoreboard screenshots for users to view. Auto-deleted after 1 week.
                        </p>
                    </div>
                </header>

                {/* Tournament List with Expandable Matches */}
                <div className="space-y-4">
                    {tournamentsLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : !tournaments || tournaments.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed rounded-lg">
                            <FiImage className="h-12 w-12 text-muted-foreground/50 mb-4" />
                            <h3 className="font-medium text-muted-foreground">
                                No tournaments found
                            </h3>
                        </div>
                    ) : (
                        tournaments.map((tournament) => {
                            const group = groups?.find(g => g.tournamentId === tournament.id);
                            const matchCount = tournament._count?.matches || 0;
                            const uploadedImageCount = group?.images.length || 0;
                            const isExpanded = expandedTournament === tournament.id;

                            return (
                                <div key={tournament.id} className="bg-card border rounded-lg overflow-hidden">
                                    {/* Tournament Header */}
                                    <div
                                        className="p-4 flex justify-between items-center cursor-pointer hover:bg-muted/30 transition-colors"
                                        onClick={() => setExpandedTournament(isExpanded ? null : tournament.id)}
                                    >
                                        <div>
                                            <h3 className="font-semibold text-lg">
                                                {tournament.name}
                                            </h3>
                                            <p className="text-sm text-muted-foreground">
                                                {matchCount} match{matchCount !== 1 ? 'es' : ''}
                                                {uploadedImageCount > 0 && ` • ${uploadedImageCount} image${uploadedImageCount !== 1 ? 's' : ''} uploaded`}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {group && (
                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        deleteMutation.mutate(group.id);
                                                    }}
                                                    disabled={deleteMutation.isPending}
                                                >
                                                    <FiTrash2 className="h-4 w-4" />
                                                </Button>
                                            )}
                                            <span className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                                                ▼
                                            </span>
                                        </div>
                                    </div>

                                    {/* Expanded Matches List */}
                                    {isExpanded && (
                                        <div className="border-t bg-muted/20">
                                            {matchCount === 0 ? (
                                                <p className="p-4 text-sm text-muted-foreground text-center">
                                                    No matches in this tournament yet
                                                </p>
                                            ) : (
                                                <div className="divide-y">
                                                    {Array.from({ length: matchCount }, (_, i) => i + 1).map((matchNum) => {
                                                        const matchImages = group?.images.filter(img => img.matchNumber === matchNum) || [];
                                                        return (
                                                            <div key={matchNum} className="p-3 flex items-center justify-between gap-2">
                                                                {/* Match info */}
                                                                <div className="flex-1 flex items-center gap-2">
                                                                    <span className="font-medium">Match {matchNum}</span>
                                                                    {matchImages.length > 0 && (
                                                                        <span className="text-xs text-muted-foreground">
                                                                            ({matchImages.length} image{matchImages.length !== 1 ? 's' : ''})
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                {/* Action buttons on right */}
                                                                <div className="flex gap-1">
                                                                    {matchImages.length > 0 && (
                                                                        <>
                                                                            <Button
                                                                                variant="outline"
                                                                                size="sm"
                                                                                onClick={() => {
                                                                                    setPreviewImages(matchImages.map(img => img.imageUrl));
                                                                                    setPreviewTitle(`${tournament.name} - Match ${matchNum}`);
                                                                                    setShowPreviewModal(true);
                                                                                }}
                                                                            >
                                                                                <FiEye className="h-4 w-4" />
                                                                            </Button>
                                                                            <Button
                                                                                variant="destructive"
                                                                                size="sm"
                                                                                onClick={() => {
                                                                                    if (group) {
                                                                                        matchImages.forEach(img => deleteImageMutation.mutate({ groupId: group.id, imageId: img.id }));
                                                                                    }
                                                                                }}
                                                                                disabled={deleteImageMutation.isPending}
                                                                            >
                                                                                <FiTrash2 className="h-4 w-4" />
                                                                            </Button>
                                                                        </>
                                                                    )}
                                                                    <Button
                                                                        size="sm"
                                                                        onClick={() => {
                                                                            setSelectedTournament(tournament.id);
                                                                            setSelectedMatchNumber(matchNum);
                                                                            setShowUploadModal(true);
                                                                        }}
                                                                    >
                                                                        <FiUpload className="h-4 w-4" />
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Upload Modal */}
                <Dialog open={showUploadModal} onOpenChange={(open) => {
                    setShowUploadModal(open);
                    if (!open) resetForm();
                }}>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>
                                {editingGroup
                                    ? `Edit: ${editingGroup.tournamentTitle}`
                                    : selectedTournament && selectedMatchNumber
                                        ? `Upload to Match ${selectedMatchNumber}`
                                        : "Add Tournament Scoreboards"
                                }
                            </DialogTitle>
                            {selectedTournament && (
                                <p className="text-sm text-muted-foreground">
                                    {tournaments?.find(t => t.id === selectedTournament)?.name}
                                    {selectedMatchNumber > 0 && ` • Match ${selectedMatchNumber}`}
                                </p>
                            )}
                        </DialogHeader>

                        <div className="space-y-6 py-4">
                            {/* Tournament Selection - only show when not pre-selected and not editing */}
                            {!editingGroup && !selectedTournament && (
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Select Tournament</label>
                                    <Select
                                        value={selectedTournament || undefined}
                                        onValueChange={handleTournamentChange}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Choose a tournament" />
                                        </SelectTrigger>
                                        <SelectContent className="max-h-60 overflow-y-auto">
                                            {tournamentsLoading ? (
                                                <div className="p-2 text-center">
                                                    <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                                                </div>
                                            ) : (
                                                tournaments?.map((t) => {
                                                    const matchCount = getMatchCountForTournament(t.id);
                                                    return (
                                                        <SelectItem key={t.id} value={t.id}>
                                                            {t.name} {matchCount > 0 && `(${matchCount} matches)`}
                                                        </SelectItem>
                                                    );
                                                })
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            {/* Existing Images - Only show for selected match in edit mode */}
                            {editingGroup && (() => {
                                const matchImages = editingGroup.images.filter(
                                    img => img.matchNumber === selectedMatchNumber
                                );
                                if (matchImages.length === 0) return null;
                                return (
                                    <div className="space-y-3">
                                        <label className="text-sm font-medium">
                                            Existing Images for Match {selectedMatchNumber}
                                        </label>
                                        <p className="text-xs text-muted-foreground">Click the X to delete an image</p>
                                        <div className="flex gap-2 flex-wrap">
                                            {matchImages.map((img) => (
                                                <div
                                                    key={img.id}
                                                    className="relative w-24 h-18 rounded-md overflow-hidden border group"
                                                >
                                                    <Image
                                                        src={img.imageUrl}
                                                        alt={`Match ${selectedMatchNumber}`}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                    <button
                                                        onClick={() => deleteImageMutation.mutate({
                                                            groupId: editingGroup.id,
                                                            imageId: img.id
                                                        })}
                                                        disabled={deleteImageMutation.isPending}
                                                        className="absolute top-0 right-0 p-1 bg-red-500 rounded-bl opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <FiX className="h-3 w-3 text-white" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })()}

                            {/* Match Number Selection - hide when pre-selected from main view */}
                            {(editingGroup || !selectedTournament) && (
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">
                                            {editingGroup ? "Add Images To" : "Match Number"}
                                        </label>
                                        <Select
                                            value={selectedMatchNumber.toString()}
                                            onValueChange={(v) => setSelectedMatchNumber(parseInt(v))}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select match" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {getMatchOptions().map((num) => {
                                                    const existingCount = editingGroup
                                                        ? editingGroup.images.filter(img => img.matchNumber === num).length
                                                        : 0;
                                                    return (
                                                        <SelectItem key={num} value={num.toString()}>
                                                            Match {num} {existingCount > 0 && `(${existingCount} existing)`}
                                                        </SelectItem>
                                                    );
                                                })}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            )}

                            {/* File previews */}
                            {uploadFiles.length > 0 && (
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <label className="text-sm font-medium">
                                            {cropRightHalf && croppedPreviews.length > 0
                                                ? `Cropped Output (${croppedPreviews.length} images)`
                                                : `Selected Files (${uploadFiles.length})`}
                                        </label>
                                        {cropRightHalf && croppedPreviews.length > 0 && (
                                            <span className="text-xs text-muted-foreground">
                                                Drag to reorder
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex gap-2 flex-wrap">
                                        {cropRightHalf && croppedPreviews.length > 0 ? (
                                            // Show cropped previews (N+1 images) with drag-to-reorder
                                            croppedPreviews.map((url, idx) => (
                                                <div
                                                    key={idx}
                                                    draggable
                                                    onDragStart={() => setDragIndex(idx)}
                                                    onDragOver={(e) => e.preventDefault()}
                                                    onDrop={() => handleDrop(idx)}
                                                    onDragEnd={() => setDragIndex(null)}
                                                    className={`relative w-24 h-20 rounded-md overflow-hidden border cursor-grab active:cursor-grabbing transition-all ${dragIndex === idx
                                                        ? "opacity-50 scale-95 border-indigo-500"
                                                        : dragIndex !== null
                                                            ? "border-dashed border-indigo-300"
                                                            : ""
                                                        }`}
                                                >
                                                    <Image
                                                        src={url}
                                                        alt={idx === 0 ? "Left half (1-3)" : `Right half ${idx}`}
                                                        fill
                                                        className="object-cover pointer-events-none"
                                                    />
                                                    <span className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-[10px] px-1 py-0.5 text-center">
                                                        {idx + 1}
                                                    </span>
                                                </div>
                                            ))
                                        ) : (
                                            // Show original files with remove button
                                            uploadFiles.map((file, idx) => (
                                                <div
                                                    key={idx}
                                                    className="relative w-20 h-16 rounded-md overflow-hidden border group"
                                                >
                                                    <Image
                                                        src={URL.createObjectURL(file)}
                                                        alt={file.name}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                    <button
                                                        onClick={() => removeFile(idx)}
                                                        className="absolute top-0 right-0 p-1 bg-black/50 rounded-bl opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <FiX className="h-3 w-3 text-white" />
                                                    </button>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                    {cropRightHalf && croppedPreviews.length > 0 && (
                                        <button
                                            onClick={() => {
                                                setUploadFiles([]);
                                                croppedPreviews.forEach(url => URL.revokeObjectURL(url));
                                                setCroppedPreviews([]);
                                            }}
                                            className="text-xs text-red-500 hover:underline"
                                        >
                                            Clear all files
                                        </button>
                                    )}
                                </div>
                            )}

                            {/* Crop toggle */}
                            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={cropRightHalf}
                                        onChange={(e) => {
                                            setCropRightHalf(e.target.checked);
                                            // Clear cropped previews when toggle changes
                                            croppedPreviews.forEach(url => URL.revokeObjectURL(url));
                                            setCroppedPreviews([]);
                                        }}
                                        className="w-4 h-4 rounded"
                                    />
                                    <FiScissors className="h-4 w-4 text-indigo-500" />
                                    <span className="text-sm font-medium">Auto-Crop Scoreboard</span>
                                </label>
                                <span className="text-xs text-muted-foreground">
                                    (1 left panel + {uploadFiles.length} right halves = {uploadFiles.length + 1} images)
                                </span>
                            </div>

                            {/* Upload input */}
                            <label className="block">
                                <div className="flex items-center justify-center w-full h-20 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                                    <div className="text-center">
                                        <FiUpload className="h-5 w-5 mx-auto text-muted-foreground" />
                                        <span className="text-sm text-muted-foreground">
                                            Click to upload images
                                        </span>
                                    </div>
                                </div>
                                <input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    className="hidden"
                                    onChange={(e) => handleFileChange(e.target.files)}
                                />
                            </label>
                        </div>

                        <DialogFooter>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    resetForm();
                                    setShowUploadModal(false);
                                }}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={() => uploadMutation.mutate()}
                                disabled={!canSubmit || uploadMutation.isPending}
                            >
                                {uploadMutation.isPending ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Uploading...
                                    </>
                                ) : (
                                    <>
                                        <FiUpload className="mr-2 h-4 w-4" />
                                        Upload
                                    </>
                                )}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Preview Modal - Shows uploaded images for screenshotting */}
                <Dialog open={showPreviewModal} onOpenChange={(open) => {
                    setShowPreviewModal(open);
                    if (!open) {
                        // Cleanup preview URLs when closing
                        previewImages.forEach(url => URL.revokeObjectURL(url));
                        setPreviewImages([]);
                    }
                }}>
                    <DialogContent className="max-w-sm max-h-[90vh] overflow-y-auto p-0 bg-[#1a1a1a]">
                        <DialogHeader className="p-3 pb-1">
                            <DialogTitle className="text-white text-sm">{previewTitle || "Preview"}</DialogTitle>
                        </DialogHeader>

                        {/* Stacked images - 2 per row for easy screenshotting */}
                        <div className="grid grid-cols-2 gap-1 p-2">
                            {previewImages.map((url, idx) => (
                                <div key={idx} className="relative w-full">
                                    <Image
                                        src={url}
                                        alt={`Image ${idx + 1}`}
                                        width={200}
                                        height={100}
                                        className="w-full h-auto object-contain"
                                        unoptimized
                                    />
                                </div>
                            ))}
                        </div>

                        <DialogFooter className="p-4 pt-2">
                            <Button
                                onClick={() => {
                                    previewImages.forEach(url => URL.revokeObjectURL(url));
                                    setPreviewImages([]);
                                    setShowPreviewModal(false);
                                }}
                                className="w-full"
                            >
                                Done
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </div >
    );
};

export default AdminRecentMatchesPage;
