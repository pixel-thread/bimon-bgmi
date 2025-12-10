"use client";

import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Badge } from "@/src/components/ui/badge";
import { Separator } from "@/src/components/ui/separator";
import { useAuth } from "@/src/hooks/context/auth/useAuth";
import http from "@/src/utils/http";
import { toast } from "sonner";
import { Loader2, User, Mail, Shield, AlertCircle, CheckCircle, Edit2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

type ProfileData = {
    id: string;
    userName: string;
    email: string | null;
    role: string;
    isEmailLinked: boolean;
    usernameLastChangeAt: string;
};

export function ProfileSettings() {
    const { user, refreshAuth } = useAuth();
    const queryClient = useQueryClient();

    const [isEditing, setIsEditing] = useState(false);
    const [userName, setUserName] = useState("");
    const [error, setError] = useState("");



    // Update local state when user changes
    useEffect(() => {
        if (user?.userName) {
            setUserName(user.userName);
        }
    }, [user?.userName]);

    const { mutate: updateProfile, isPending: isUpdating } = useMutation({
        mutationFn: (data: { userName: string }) => http.patch("/profile", data),
        onSuccess: (response) => {
            if (response.success) {
                toast.success(response.message || "Profile updated successfully!");
                setIsEditing(false);
                setError("");
                refreshAuth(); // Refresh auth context to get updated user data
                queryClient.invalidateQueries({ queryKey: ["auth"] });
            } else {
                setError(response.message || "Failed to update profile");
                toast.error(response.message || "Failed to update profile");
            }
        },
        onError: (error: any) => {
            const message = error?.response?.data?.message || "Failed to update profile";
            setError(message);
            toast.error(message);
        },
    });

    const validateUsername = (value: string) => {
        if (value.length < 3) {
            return "Username must be at least 3 characters";
        }
        if (value.length > 30) {
            return "Username must be at most 30 characters";
        }
        if (!/^[a-zA-Z0-9_]+$/.test(value)) {
            return "Username can only contain letters, numbers, and underscores";
        }
        return "";
    };

    const handleSave = () => {
        const validationError = validateUsername(userName);
        if (validationError) {
            setError(validationError);
            return;
        }

        if (userName === user?.userName) {
            setError("This is already your current username");
            return;
        }

        setError("");
        updateProfile({ userName });
    };

    const handleCancel = () => {
        setUserName(user?.userName || "");
        setIsEditing(false);
        setError("");
    };

    const getRoleBadgeColor = (role: string) => {
        switch (role) {
            case "SUPER_ADMIN":
                return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300";
            case "ADMIN":
                return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
            case "PLAYER":
                return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
            default:
                return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
        }
    };

    return (
        <div className="space-y-6">
            {/* Profile Information Card */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <User className="w-5 h-5" />
                        Profile Information
                    </CardTitle>
                    <CardDescription>
                        Manage your account details and username
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Username Section */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="username" className="text-base font-medium">
                                Username
                            </Label>
                            {!isEditing && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setIsEditing(true)}
                                    className="text-primary hover:text-primary/80"
                                >
                                    <Edit2 className="w-4 h-4 mr-1" />
                                    Edit
                                </Button>
                            )}
                        </div>

                        {isEditing ? (
                            <div className="space-y-3">
                                <Input
                                    id="username"
                                    value={userName}
                                    onChange={(e) => {
                                        setUserName(e.target.value);
                                        setError("");
                                    }}
                                    placeholder="Enter new username"
                                    className={error ? "border-red-500 focus-visible:ring-red-500" : ""}
                                    disabled={isUpdating}
                                />
                                {error && (
                                    <div className="flex items-center gap-2 text-sm text-red-600">
                                        <AlertCircle className="w-4 h-4" />
                                        {error}
                                    </div>
                                )}
                                <p className="text-xs text-muted-foreground">
                                    Username can only contain letters, numbers, and underscores (3-30 characters)
                                </p>
                                <div className="flex gap-2">
                                    <Button
                                        onClick={handleSave}
                                        disabled={isUpdating || !userName.trim()}
                                        size="sm"
                                    >
                                        {isUpdating ? (
                                            <>
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                Saving...
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle className="w-4 h-4 mr-2" />
                                                Save Changes
                                            </>
                                        )}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={handleCancel}
                                        disabled={isUpdating}
                                        size="sm"
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                                <span className="font-medium">{user?.userName}</span>
                            </div>
                        )}
                    </div>

                    <Separator />

                    {/* Email Section */}
                    <div className="space-y-2">
                        <Label className="text-base font-medium flex items-center gap-2">
                            <Mail className="w-4 h-4" />
                            Email
                        </Label>
                        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                            <span className={user?.email ? "" : "text-muted-foreground italic"}>
                                {user?.email || "No email linked"}
                            </span>
                            {user?.isEmailLinked && (
                                <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400">
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    Verified
                                </Badge>
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Email is managed through your authentication provider
                        </p>
                    </div>

                    <Separator />

                    {/* Role Section */}
                    <div className="space-y-2">
                        <Label className="text-base font-medium flex items-center gap-2">
                            <Shield className="w-4 h-4" />
                            Account Role
                        </Label>
                        <div className="p-3 bg-muted/50 rounded-lg">
                            <Badge className={getRoleBadgeColor(user?.role || "USER")}>
                                {user?.role || "USER"}
                            </Badge>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Account Status Card */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Account Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="p-4 bg-muted/30 rounded-lg">
                            <p className="text-sm text-muted-foreground mb-1">Player Status</p>
                            {user?.player?.isBanned ? (
                                <Badge variant="destructive">Banned</Badge>
                            ) : user?.player ? (
                                <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400">
                                    Active Player
                                </Badge>
                            ) : (
                                <Badge variant="secondary">Not a Player</Badge>
                            )}
                        </div>
                        <div className="p-4 bg-muted/30 rounded-lg">
                            <p className="text-sm text-muted-foreground mb-1">Last Username Change</p>
                            <p className="font-medium text-sm">
                                {user?.usernameLastChangeAt
                                    ? formatDistanceToNow(new Date(user.usernameLastChangeAt), { addSuffix: true })
                                    : "Never"}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
