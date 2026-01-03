"use client";

import { useState } from "react";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card";
import { FiTrash2, FiAlertTriangle, FiRefreshCw } from "react-icons/fi";
import { toast } from "sonner";
import http from "@/src/utils/http";
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

export const CleanupUsersCard = () => {
    const [count, setCount] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const fetchCount = async () => {
        setIsLoading(true);
        try {
            const res = await http.get<{ count: number }>("/api/admin/users/cleanup");
            setCount(res.data?.count ?? 0);
        } catch (error) {
            toast.error("Failed to fetch incomplete users count");
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCleanup = async () => {
        setIsDeleting(true);
        try {
            const res = await http.delete<{ deleted: number; total: number }>("/api/admin/users/cleanup");
            const deleted = res.data?.deleted ?? 0;
            toast.success(`Deleted ${deleted} incomplete user(s)`);
            setCount(0);
            setShowConfirm(false);
        } catch (error) {
            toast.error("Cleanup failed");
            console.error(error);
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <>
            <Card className="border-amber-200 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/20">
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2 text-amber-800 dark:text-amber-200">
                        <FiAlertTriangle className="h-5 w-5" />
                        Cleanup Incomplete Users
                    </CardTitle>
                    <CardDescription className="text-amber-700 dark:text-amber-300/80">
                        Delete users who haven&apos;t completed onboarding and were created more than 7 days ago.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center gap-3 flex-wrap">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={fetchCount}
                            disabled={isLoading}
                            className="gap-2"
                        >
                            <FiRefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                            {count === null ? "Check Count" : "Refresh"}
                        </Button>

                        {count !== null && (
                            <span className="text-sm font-medium text-amber-800 dark:text-amber-200">
                                {count} incomplete user{count !== 1 ? "s" : ""} found
                            </span>
                        )}
                    </div>

                    {count !== null && count > 0 && (
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => setShowConfirm(true)}
                            disabled={isDeleting}
                            className="gap-2"
                        >
                            <FiTrash2 className="h-4 w-4" />
                            Delete {count} User{count !== 1 ? "s" : ""}
                        </Button>
                    )}
                </CardContent>
            </Card>

            <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete <strong>{count}</strong> incomplete user{count !== 1 ? "s" : ""} from both Clerk and the database. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleCleanup}
                            disabled={isDeleting}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isDeleting ? "Deleting..." : "Delete"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
};
