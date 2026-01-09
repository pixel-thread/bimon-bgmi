"use client";

import React, { useState } from "react";
import { Briefcase, Plus, Edit, Trash2, Phone, Loader2 } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import {
    useMyJobListings,
    useDeleteJobListing,
    JobListing,
} from "@/src/hooks/jobListing/useJobListings";
import { Skeleton } from "@/src/components/ui/skeleton";
import { JobListingDialog } from "./JobListingDialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/src/components/ui/alert-dialog";

export function JobListingManager() {
    const { data: listings, isLoading } = useMyJobListings();
    const { mutate: deleteListing, isPending: isDeleting } = useDeleteJobListing();

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingListing, setEditingListing] = useState<JobListing | null>(null);
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

    const handleEdit = (listing: JobListing) => {
        setEditingListing(listing);
        setIsDialogOpen(true);
    };

    const handleAdd = () => {
        setEditingListing(null);
        setIsDialogOpen(true);
    };

    const handleDialogClose = () => {
        setIsDialogOpen(false);
        setEditingListing(null);
    };

    const handleDelete = () => {
        if (deleteConfirmId) {
            deleteListing(deleteConfirmId);
            setDeleteConfirmId(null);
        }
    };

    const getDisplayCategory = (listing: JobListing) => {
        return listing.category === "Other"
            ? listing.customCategory || "Other"
            : listing.category;
    };

    return (
        <>
            {/* Job Listings Section - Glassmorphism */}
            <div className="relative rounded-2xl overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-orange-500/10 to-yellow-500/10 dark:from-amber-600/15 dark:via-orange-600/15 dark:to-yellow-600/15" />
                <div className="absolute inset-0 backdrop-blur-3xl" />

                <div className="relative p-4 md:p-5">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                                <Briefcase className="w-4 h-4 text-white" />
                            </div>
                            <h3 className="font-semibold">My Job Listings</h3>
                            {listings && listings.length > 0 && (
                                <Badge variant="secondary" className="text-xs">
                                    {listings.length}
                                </Badge>
                            )}
                        </div>
                        <Button
                            size="sm"
                            className="h-8 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
                            onClick={handleAdd}
                        >
                            <Plus className="w-4 h-4 mr-1" />
                            Add Job
                        </Button>
                    </div>

                    {isLoading ? (
                        <div className="space-y-2">
                            {[...Array(2)].map((_, i) => (
                                <div
                                    key={i}
                                    className="p-3 rounded-xl bg-white/50 dark:bg-slate-800/50"
                                >
                                    <Skeleton className="h-4 w-32 mb-2" />
                                    <Skeleton className="h-3 w-full" />
                                </div>
                            ))}
                        </div>
                    ) : !listings || listings.length === 0 ? (
                        <div className="text-center py-8">
                            <Briefcase className="w-12 h-12 mx-auto text-amber-400 mb-3 opacity-50" />
                            <p className="text-sm text-muted-foreground mb-3">
                                You haven&apos;t added any job listings yet.
                            </p>
                            <p className="text-xs text-muted-foreground">
                                Showcase your skills to the community!
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {listings.map((listing) => (
                                <div
                                    key={listing.id}
                                    className="flex items-start justify-between gap-3 p-3 rounded-xl bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-white/20 dark:border-slate-700/50"
                                >
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200">
                                                {getDisplayCategory(listing)}
                                            </span>
                                            {!listing.isActive && (
                                                <Badge variant="secondary" className="text-xs">
                                                    Inactive
                                                </Badge>
                                            )}
                                        </div>
                                        <p className="font-medium text-sm mt-1">{listing.title}</p>
                                        {listing.description && (
                                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                                                {listing.description}
                                            </p>
                                        )}
                                        <div className="flex items-center gap-1.5 mt-1.5 text-xs text-green-600 dark:text-green-400">
                                            <Phone className="w-3 h-3" />
                                            {listing.phoneNumber}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 w-8 p-0"
                                            onClick={() => handleEdit(listing)}
                                        >
                                            <Edit className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                            onClick={() => setDeleteConfirmId(listing.id)}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Create/Edit Dialog */}
            <JobListingDialog
                open={isDialogOpen}
                onOpenChange={handleDialogClose}
                editListing={editingListing}
            />

            {/* Delete Confirmation */}
            <AlertDialog
                open={!!deleteConfirmId}
                onOpenChange={() => setDeleteConfirmId(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Job Listing?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently remove your job
                            listing from the community board.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-red-500 hover:bg-red-600"
                            disabled={isDeleting}
                        >
                            {isDeleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
