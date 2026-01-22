"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import http from "@/src/utils/http";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Skeleton } from "@/src/components/ui/skeleton";
import { Badge } from "@/src/components/ui/badge";
import { PlayerAvatar } from "@/src/components/ui/player-avatar";
import { toast } from "sonner";
import { FiBriefcase, FiCheck, FiTrash2, FiFilter } from "react-icons/fi";
import { ThumbsUp, ThumbsDown, Ban, CheckCircle } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/src/components/ui/select";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/src/components/ui/alert-dialog";

interface JobListing {
    id: string;
    category: string;
    category2: string | null;
    title: string;
    description: string | null;
    phoneNumber: string;
    experience: string | null;
    isActive: boolean;
    isJobBanned: boolean;
    likeCount: number;
    dislikeCount: number;
    createdAt: string;
    player: {
        id: string;
        user: { userName: string; displayName: string | null };
        characterImage: { publicUrl: string } | null;
    };
}

function useAdminJobListings(filter: string) {
    return useQuery({
        queryKey: ["adminJobListings", filter],
        queryFn: () => http.get<JobListing[]>(`/admin/job-listings?filter=${filter}`),
        select: (data) => data.data,
    });
}

function useUnbanListing() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => http.patch(`/admin/job-listings/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["adminJobListings"] });
            toast.success("Job listing unbanned successfully");
        },
        onError: () => {
            toast.error("Failed to unban job listing");
        },
    });
}

function useDeleteListing() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => http.delete(`/admin/job-listings/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["adminJobListings"] });
            toast.success("Job listing deleted successfully");
        },
        onError: () => {
            toast.error("Failed to delete job listing");
        },
    });
}

export default function AdminJobListingsPage() {
    const [filter, setFilter] = useState<string>("all");
    const { data: listings, isLoading } = useAdminJobListings(filter);
    const { mutate: unban, isPending: isUnbanning } = useUnbanListing();
    const { mutate: deleteListing, isPending: isDeleting } = useDeleteListing();

    const isPending = isUnbanning || isDeleting;

    return (
        <div className="min-h-screen bg-background text-foreground">
            <div className="max-w-7xl mx-auto space-y-6">
                <header className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-3 text-slate-800 dark:text-foreground">
                            <FiBriefcase className="h-8 w-8 text-amber-600" />
                            Job Listings Management
                        </h1>
                        <p className="mt-2 text-sm text-slate-500 dark:text-muted-foreground">
                            View and manage player job listings. Unban listings that were auto-banned.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <FiFilter className="h-4 w-4 text-muted-foreground" />
                        <Select value={filter} onValueChange={setFilter}>
                            <SelectTrigger className="w-40">
                                <SelectValue placeholder="Filter" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Listings</SelectItem>
                                <SelectItem value="active">Active Only</SelectItem>
                                <SelectItem value="banned">Banned Only</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </header>

                {isLoading ? (
                    <div className="grid gap-4">
                        {[1, 2, 3].map((i) => (
                            <Card key={i}>
                                <CardContent className="p-4">
                                    <div className="flex items-center gap-4">
                                        <Skeleton className="h-10 w-10 rounded-full" />
                                        <div className="flex-1 space-y-2">
                                            <Skeleton className="h-4 w-48" />
                                            <Skeleton className="h-3 w-32" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : !listings?.length ? (
                    <Card>
                        <CardContent className="p-8 text-center text-muted-foreground">
                            No job listings found for the selected filter.
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-4">
                        {listings.map((listing) => (
                            <Card key={listing.id} className={listing.isJobBanned ? "border-red-500/50" : ""}>
                                <CardContent className="p-4">
                                    <div className="flex items-start gap-4">
                                        <PlayerAvatar
                                            characterImageUrl={(listing.player as any).customProfileImageUrl || listing.player.characterImage?.publicUrl}
                                            displayName={listing.player.user.displayName || ""}
                                            userName={listing.player.user.userName}
                                            size="sm"
                                        />

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="font-semibold">
                                                    {listing.player.user.displayName || listing.player.user.userName}
                                                </span>
                                                <Badge variant="outline" className="text-xs">
                                                    {listing.category}
                                                    {listing.category2 && ` • ${listing.category2}`}
                                                </Badge>
                                                {listing.likeCount >= 10 && (
                                                    <CheckCircle className="h-4 w-4 text-blue-500" />
                                                )}
                                                {listing.isJobBanned && (
                                                    <Badge variant="destructive" className="gap-1">
                                                        <Ban className="h-3 w-3" /> Banned
                                                    </Badge>
                                                )}
                                            </div>

                                            <p className="font-medium mt-1">{listing.title}</p>
                                            {listing.description && (
                                                <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">
                                                    {listing.description}
                                                </p>
                                            )}

                                            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                                                <span className="flex items-center gap-1">
                                                    <ThumbsUp className="h-3.5 w-3.5 text-green-500" />
                                                    {listing.likeCount}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <ThumbsDown className="h-3.5 w-3.5 text-red-500" />
                                                    {listing.dislikeCount}
                                                </span>
                                                <span>📞 {listing.phoneNumber}</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 shrink-0">
                                            {listing.isJobBanned && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => unban(listing.id)}
                                                    disabled={isPending}
                                                    className="gap-1 text-green-600 border-green-600 hover:bg-green-50 dark:hover:bg-green-950"
                                                >
                                                    <FiCheck className="h-4 w-4" />
                                                    Unban
                                                </Button>
                                            )}

                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        disabled={isPending}
                                                        className="gap-1 text-red-600 border-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                                                    >
                                                        <FiTrash2 className="h-4 w-4" />
                                                        Delete
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Delete Job Listing?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            This will permanently delete this job listing. This action cannot be undone.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction
                                                            onClick={() => deleteListing(listing.id)}
                                                            className="bg-red-600 hover:bg-red-700"
                                                        >
                                                            Delete
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}

                <div className="text-center text-sm text-muted-foreground">
                    Total: {listings?.length || 0} listings
                </div>
            </div>
        </div>
    );
}
