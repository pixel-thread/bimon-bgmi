"use client";
import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import http from "@/src/utils/http";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Badge } from "@/src/components/ui/badge";
import { Bell, Check, X, ArrowUpRight, ArrowDownLeft, Clock, DollarSign } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/src/hooks/context/auth/useAuth";
import { formatDistanceToNow } from "date-fns";

type UCTransfer = {
    id: string;
    amount: number;
    type: "REQUEST" | "SEND";
    status: "PENDING" | "APPROVED" | "REJECTED" | "COMPLETED";
    message?: string;
    fromPlayerId: string;
    fromPlayer: { user: { userName: string } };
    toPlayerId: string;
    toPlayer: { user: { userName: string } };
    createdAt: string;
};

type Notification = {
    id: string;
    title: string;
    message: string;
    isRead: boolean;
    type: string;
    link?: string;
    createdAt: string;
};

export default function ProfilePage() {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const playerId = user?.playerId || user?.player?.id;
    const userBalance = user?.player?.uc?.balance || 0;

    // Fetch transfers
    const { data: transfersData } = useQuery({
        queryKey: ["uc-transfers"],
        queryFn: () => http.get<UCTransfer[]>("/uc-transfers"),
        enabled: !!playerId,
    });

    // Fetch notifications
    const { data: notificationsData } = useQuery({
        queryKey: ["notifications"],
        queryFn: () => http.get<{ notifications: Notification[]; unreadCount: number }>("/notifications"),
        enabled: !!playerId,
    });

    const transfers = transfersData?.data || [];
    const notifications = notificationsData?.data?.notifications || [];
    const unreadCount = notificationsData?.data?.unreadCount || 0;

    // Filter pending requests where the current user needs to approve
    const pendingRequests = transfers.filter(
        (t) => t.status === "PENDING" && t.type === "REQUEST" && t.toPlayerId === playerId
    );

    // Approve mutation
    const { mutate: approveTransfer, isPending: isApproving } = useMutation({
        mutationFn: (id: string) => http.patch(`/uc-transfers/${id}/approve`, {}),
        onSuccess: (data) => {
            if (data.success) {
                toast.success(data.message || "Transfer approved");
                queryClient.invalidateQueries({ queryKey: ["uc-transfers"] });
                queryClient.invalidateQueries({ queryKey: ["notifications"] });
                queryClient.invalidateQueries({ queryKey: ["player"] });
            } else {
                toast.error(data.message || "Failed to approve");
            }
        },
        onError: () => toast.error("Failed to approve transfer"),
    });

    // Reject mutation
    const { mutate: rejectTransfer, isPending: isRejecting } = useMutation({
        mutationFn: (id: string) => http.patch(`/uc-transfers/${id}/reject`, {}),
        onSuccess: (data) => {
            if (data.success) {
                toast.success(data.message || "Transfer rejected");
                queryClient.invalidateQueries({ queryKey: ["uc-transfers"] });
                queryClient.invalidateQueries({ queryKey: ["notifications"] });
            } else {
                toast.error(data.message || "Failed to reject");
            }
        },
        onError: () => toast.error("Failed to reject transfer"),
    });

    // Mark all as read
    const { mutate: markAllRead } = useMutation({
        mutationFn: () => http.post("/notifications/read-all", {}),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["notifications"] });
        },
    });

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "PENDING":
                return <Badge variant="outline" className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
            case "APPROVED":
            case "COMPLETED":
                return <Badge variant="outline" className="bg-green-100 text-green-800"><Check className="w-3 h-3 mr-1" /> Completed</Badge>;
            case "REJECTED":
                return <Badge variant="outline" className="bg-red-100 text-red-800"><X className="w-3 h-3 mr-1" /> Rejected</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    // Show login message if no user at all
    if (!user) {
        return (
            <div className="container mx-auto px-4 py-8">
                <Card>
                    <CardContent className="py-12 text-center text-muted-foreground">
                        Please log in to view your profile.
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Show message if user is not a player (no playerId)
    if (!playerId) {
        return (
            <div className="container mx-auto px-4 py-8">
                <Card>
                    <CardContent className="py-12 text-center text-muted-foreground">
                        <p>You are logged in as <strong>{user.userName}</strong> ({user.role})</p>
                        <p className="mt-2">UC transfers are only available for player accounts.</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 space-y-8">
            <h1 className="text-3xl font-bold">My Profile</h1>

            {/* Pending Requests Section */}
            {pendingRequests.length > 0 && (
                <Card className="border-yellow-300 bg-yellow-50 dark:bg-yellow-900/20">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
                            <Clock className="w-5 h-5" />
                            Pending UC Requests ({pendingRequests.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {pendingRequests.map((request) => (
                            <div
                                key={request.id}
                                className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm"
                            >
                                <div>
                                    <p className="font-medium">
                                        <span className="text-blue-600">{request.fromPlayer.user.userName}</span>
                                        {" "}requested{" "}
                                        <span className="font-bold text-green-600">{request.amount} UC</span>
                                    </p>
                                    {request.message && (
                                        <p className="text-sm text-muted-foreground mt-1">"{request.message}"</p>
                                    )}
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })}
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="border-green-600 text-green-600 hover:bg-green-50 disabled:opacity-50"
                                        onClick={() => {
                                            if (userBalance < request.amount) {
                                                toast.error(`Insufficient balance. You need ${request.amount} UC but have ${userBalance} UC.`);
                                                return;
                                            }
                                            approveTransfer(request.id);
                                        }}
                                        disabled={isApproving || isRejecting || userBalance < request.amount}
                                    >
                                        <Check className="w-4 h-4 mr-1" /> Approve
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="border-red-600 text-red-600 hover:bg-red-50"
                                        onClick={() => rejectTransfer(request.id)}
                                        disabled={isApproving || isRejecting}
                                    >
                                        <X className="w-4 h-4 mr-1" /> Reject
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}

            {/* Notifications Section */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <Bell className="w-5 h-5" />
                        Notifications
                        {unreadCount > 0 && (
                            <Badge variant="destructive" className="ml-2">{unreadCount}</Badge>
                        )}
                    </CardTitle>
                    {unreadCount > 0 && (
                        <Button variant="ghost" size="sm" onClick={() => markAllRead()}>
                            Mark all as read
                        </Button>
                    )}
                </CardHeader>
                <CardContent>
                    {notifications.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">No notifications yet</p>
                    ) : (
                        <div className="space-y-3">
                            {notifications.slice(0, 10).map((notification) => (
                                <div
                                    key={notification.id}
                                    className={`p-4 rounded-lg ${notification.isRead ? "bg-gray-50 dark:bg-gray-800" : "bg-blue-50 dark:bg-blue-900/20"}`}
                                >
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-medium">{notification.title}</p>
                                            <p className="text-sm text-muted-foreground">{notification.message}</p>
                                        </div>
                                        <span className="text-xs text-muted-foreground">
                                            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Transfer History */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <DollarSign className="w-5 h-5" />
                        Transfer History
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {transfers.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">No transfers yet</p>
                    ) : (
                        <div className="space-y-3">
                            {transfers.map((transfer) => (
                                <div
                                    key={transfer.id}
                                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
                                >
                                    <div className="flex items-center gap-3">
                                        {transfer.fromPlayerId === playerId ? (
                                            <ArrowUpRight className="w-5 h-5 text-red-500" />
                                        ) : (
                                            <ArrowDownLeft className="w-5 h-5 text-green-500" />
                                        )}
                                        <div>
                                            <p className="font-medium">
                                                {transfer.fromPlayerId === playerId ? (
                                                    <>
                                                        {transfer.type === "SEND" ? "Sent to" : "Requested from"}{" "}
                                                        <span className="text-blue-600">{transfer.toPlayer.user.userName}</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        {transfer.type === "SEND" ? "Received from" : "Request from"}{" "}
                                                        <span className="text-blue-600">{transfer.fromPlayer.user.userName}</span>
                                                    </>
                                                )}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {formatDistanceToNow(new Date(transfer.createdAt), { addSuffix: true })}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className={`font-bold ${transfer.fromPlayerId === playerId ? "text-red-600" : "text-green-600"}`}>
                                            {transfer.fromPlayerId === playerId ? "-" : "+"}{transfer.amount} UC
                                        </span>
                                        {getStatusBadge(transfer.status)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
