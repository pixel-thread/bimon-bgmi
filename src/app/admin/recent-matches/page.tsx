"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { FiUpload, FiTrash2, FiImage, FiX, FiEdit } from "react-icons/fi";
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
    matches?: { id: string }[];
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
        select: (data) => data.data,
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

            uploadFiles.forEach((file, idx) => {
                formData.append(`match_${selectedMatchNumber}_${idx}`, file);
            });

            return http.post("/admin/recent-matches", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
        },
        onSuccess: () => {
            toast.success("Scoreboards uploaded successfully!");
            queryClient.invalidateQueries({ queryKey: ["recent-matches"] });
            resetForm();
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

    const handleFileChange = (files: FileList | null) => {
        if (!files) return;
        setUploadFiles([...uploadFiles, ...Array.from(files)]);
    };

    const removeFile = (fileIndex: number) => {
        setUploadFiles(uploadFiles.filter((_, i) => i !== fileIndex));
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

                    <Button onClick={openUploadModal}>
                        <FiUpload className="mr-2 h-4 w-4" />
                        Upload Scoreboards
                    </Button>
                </header>

                {/* Existing Groups */}
                <div className="space-y-4">
                    {groupsLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : !groups || groups.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed rounded-lg">
                            <FiImage className="h-12 w-12 text-muted-foreground/50 mb-4" />
                            <h3 className="font-medium text-muted-foreground">
                                No scoreboards uploaded yet
                            </h3>
                            <p className="text-sm text-muted-foreground/70 mt-1">
                                Click "Upload Scoreboards" to add match screenshots.
                            </p>
                        </div>
                    ) : (
                        groups.map((group) => {
                            const matchCount = new Set(group.images.map(img => img.matchNumber)).size;
                            return (
                                <div
                                    key={group.id}
                                    className="bg-card border rounded-lg p-4 hover:border-primary/50 transition-colors cursor-pointer"
                                    onClick={() => openEditModal(group)}
                                >
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <h3 className="font-semibold text-lg">
                                                {group.tournamentTitle}
                                            </h3>
                                            <p className="text-sm text-muted-foreground">
                                                {matchCount} match{matchCount !== 1 ? 'es' : ''} • {group.images.length} image{group.images.length !== 1 ? 's' : ''}
                                            </p>
                                            <p className="text-xs text-muted-foreground/70 mt-1">
                                                Uploaded {new Date(group.createdAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    openEditModal(group);
                                                }}
                                            >
                                                <FiEdit className="h-4 w-4" />
                                            </Button>
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
                                        </div>
                                    </div>
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
                                {editingGroup ? `Edit: ${editingGroup.tournamentTitle}` : "Upload Scoreboards"}
                            </DialogTitle>
                        </DialogHeader>

                        <div className="space-y-6 py-4">
                            {/* Tournament Selection - disabled in edit mode */}
                            {!editingGroup && (
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Select Tournament</label>
                                    <Select
                                        value={selectedTournament}
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

                            {/* Match Number Selection */}
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

                                {/* File previews */}
                                {uploadFiles.length > 0 && (
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Selected Files</label>
                                        <div className="flex gap-2 flex-wrap">
                                            {uploadFiles.map((file, idx) => (
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
                                            ))}
                                        </div>
                                    </div>
                                )}

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
            </div>
        </div>
    );
};

export default AdminRecentMatchesPage;
