"use client";

import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Badge } from "@/src/components/ui/badge";
import { Separator } from "@/src/components/ui/separator";
import { useAuth } from "@/src/hooks/context/auth/useAuth";
import http from "@/src/utils/http";
import { toast } from "sonner";
import { Loader2, User, Mail, Shield, AlertCircle, CheckCircle, Edit2, ChevronRight, Calendar } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ProfileImageSelector } from "@/src/components/profile/ProfileImageSelector";
import { GameNameInput, validateDisplayName } from "@/src/components/common/GameNameInput";

export function ProfileSettings() {
    const { user, refreshAuth } = useAuth();
    const queryClient = useQueryClient();

    // Username editing state
    const [isEditingUsername, setIsEditingUsername] = useState(false);
    const [isUsernameExpanded, setIsUsernameExpanded] = useState(false);
    const [userName, setUserName] = useState("");
    const [userNameError, setUserNameError] = useState("");

    // Display name editing state
    const [isEditingDisplayName, setIsEditingDisplayName] = useState(false);
    const [displayName, setDisplayName] = useState("");
    const [displayNameError, setDisplayNameError] = useState("");

    // Date of birth editing state
    const [isEditingDob, setIsEditingDob] = useState(false);
    const [dateOfBirth, setDateOfBirth] = useState("");
    const [dobError, setDobError] = useState("");


    // Update local state when user changes
    useEffect(() => {
        if (user?.userName) {
            setUserName(user.userName);
        }
        if (user?.displayName) {
            // Sanitize BGMI invisible characters when loading
            const sanitized = user.displayName
                .replace(/[ĀāĒēĪīŌōŪū]/g, " ")
                .replace(/\s+/g, " ");
            setDisplayName(sanitized);
        } else if (user?.userName) {
            // Pre-fill with username if no display name set
            setDisplayName(user.userName);
        }
        if (user?.dateOfBirth) {
            // Format date for input (YYYY-MM-DD)
            const date = new Date(user.dateOfBirth);
            setDateOfBirth(date.toISOString().split('T')[0]);
        }
    }, [user?.userName, user?.displayName, user?.dateOfBirth]);

    const { mutate: updateUsername, isPending: isUpdatingUsername } = useMutation({
        mutationFn: (data: { userName: string }) => http.patch("/profile", data),
        onSuccess: (response) => {
            if (response.success) {
                toast.success("Username updated successfully!");
                setIsEditingUsername(false);
                setUserNameError("");
                refreshAuth();
                queryClient.invalidateQueries({ queryKey: ["auth"] });
            } else {
                setUserNameError(response.message || "Failed to update username");
                toast.error(response.message || "Failed to update username");
            }
        },
        onError: (error: any) => {
            const message = error?.response?.data?.message || "Failed to update username";
            setUserNameError(message);
            toast.error(message);
        },
    });

    const { mutate: updateDisplayName, isPending: isUpdatingDisplayName } = useMutation({
        mutationFn: (data: { displayName: string }) => http.patch("/profile", data),
        onSuccess: (response) => {
            if (response.success) {
                toast.success("BGMI IGN updated successfully!");
                setIsEditingDisplayName(false);
                setDisplayNameError("");
                refreshAuth();
                queryClient.invalidateQueries({ queryKey: ["auth"] });
            } else {
                setDisplayNameError(response.message || "Failed to update IGN");
                toast.error(response.message || "Failed to update IGN");
            }
        },
        onError: (error: any) => {
            const message = error?.response?.data?.message || "Failed to update IGN";
            setDisplayNameError(message);
            toast.error(message);
        },
    });

    const { mutate: updateDob, isPending: isUpdatingDob } = useMutation({
        mutationFn: (data: { dateOfBirth: string }) => http.patch("/profile", data),
        onSuccess: (response) => {
            if (response.success) {
                toast.success("Date of birth updated successfully!");
                setIsEditingDob(false);
                setDobError("");
                refreshAuth();
                queryClient.invalidateQueries({ queryKey: ["auth"] });
            } else {
                setDobError(response.message || "Failed to update date of birth");
                toast.error(response.message || "Failed to update date of birth");
            }
        },
        onError: (error: any) => {
            const message = error?.response?.data?.message || "Failed to update date of birth";
            setDobError(message);
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

    const handleSaveUsername = () => {
        const validationError = validateUsername(userName);
        if (validationError) {
            setUserNameError(validationError);
            return;
        }

        if (userName === user?.userName) {
            setUserNameError("This is already your current username");
            return;
        }

        setUserNameError("");
        updateUsername({ userName });
    };

    const handleSaveDisplayName = () => {
        const validationError = validateDisplayName(displayName);
        if (validationError) {
            setDisplayNameError(validationError);
            return;
        }

        if (displayName === user?.displayName) {
            setDisplayNameError("This is already your current IGN");
            return;
        }

        setDisplayNameError("");
        updateDisplayName({ displayName });
    };

    const handleCancelUsername = () => {
        setUserName(user?.userName || "");
        setIsEditingUsername(false);
        setUserNameError("");
    };

    const handleCancelDisplayName = () => {
        setDisplayName(user?.displayName || "");
        setIsEditingDisplayName(false);
        setDisplayNameError("");
    };

    const handleSaveDob = () => {
        if (!dateOfBirth) {
            setDobError("Please select a date");
            return;
        }
        setDobError("");
        updateDob({ dateOfBirth });
    };

    const handleCancelDob = () => {
        if (user?.dateOfBirth) {
            const date = new Date(user.dateOfBirth);
            setDateOfBirth(date.toISOString().split('T')[0]);
        } else {
            setDateOfBirth("");
        }
        setIsEditingDob(false);
        setDobError("");
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
        <>
            <div className="space-y-6">
                {/* Profile Image Selector */}
                <ProfileImageSelector />

                {/* Profile Information Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User className="w-5 h-5" />
                            Profile Information
                        </CardTitle>
                        <CardDescription>
                            Manage your account details and usernames
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Display Name (Game Name) Section */}
                        <div className="space-y-3">
                            <GameNameInput
                                value={displayName}
                                onChange={setDisplayName}
                                error={displayNameError}
                                onErrorChange={setDisplayNameError}
                                disabled={isUpdatingDisplayName}
                                autoOpenTutorial={false}
                                tutorialButtonSize="sm"
                                readOnly={true}
                            />

                            {/* Show Cancel/Save buttons only when there are changes */}
                            {displayName !== (user?.displayName || user?.userName || "") && (
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        onClick={() => setDisplayName(user?.displayName || user?.userName || "")}
                                        disabled={isUpdatingDisplayName}
                                        size="sm"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={handleSaveDisplayName}
                                        disabled={isUpdatingDisplayName || !displayName.trim() || !!displayNameError}
                                        size="sm"
                                    >
                                        {isUpdatingDisplayName ? (
                                            <>
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                Saving...
                                            </>
                                        ) : (
                                            "Save"
                                        )}
                                    </Button>
                                </div>
                            )}
                        </div>



                        <Separator />

                        {/* Date of Birth Section */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="dateOfBirth" className="text-base font-medium flex items-center gap-2">
                                    <Calendar className="w-4 h-4" />
                                    Date of Birth
                                    <span className="text-xs text-muted-foreground font-normal">(Optional)</span>
                                </Label>
                                {!isEditingDob && !user?.dateOfBirth && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setIsEditingDob(true)}
                                        className="text-primary hover:text-primary/80"
                                    >
                                        <Edit2 className="w-4 h-4 mr-1" />
                                        Add
                                    </Button>
                                )}
                            </div>

                            {isEditingDob ? (
                                <div className="space-y-3">
                                    <Input
                                        id="dateOfBirth"
                                        type="date"
                                        value={dateOfBirth}
                                        onChange={(e) => {
                                            setDateOfBirth(e.target.value);
                                            setDobError("");
                                        }}
                                        max={new Date().toISOString().split('T')[0]}
                                        className={dobError ? "border-red-500 focus-visible:ring-red-500" : ""}
                                        disabled={isUpdatingDob}
                                    />
                                    {dobError && (
                                        <div className="flex items-center gap-2 text-sm text-red-600">
                                            <AlertCircle className="w-4 h-4" />
                                            {dobError}
                                        </div>
                                    )}
                                    <p className="text-xs text-muted-foreground">
                                        🎁 Add your birthday for free entry fee for the current tournament!
                                    </p>
                                    <div className="flex gap-2">
                                        <Button
                                            onClick={handleSaveDob}
                                            disabled={isUpdatingDob || !dateOfBirth}
                                            size="sm"
                                        >
                                            {isUpdatingDob ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                    Saving...
                                                </>
                                            ) : (
                                                <>
                                                    <CheckCircle className="w-4 h-4 mr-2" />
                                                    Save
                                                </>
                                            )}
                                        </Button>
                                        <Button
                                            variant="outline"
                                            onClick={handleCancelDob}
                                            disabled={isUpdatingDob}
                                            size="sm"
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                                        <span className={user?.dateOfBirth ? "font-medium" : "text-muted-foreground italic"}>
                                            {user?.dateOfBirth
                                                ? new Date(user.dateOfBirth).toLocaleDateString('en-US', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric'
                                                })
                                                : "Not set"}
                                        </span>
                                    </div>
                                    {user?.dateOfBirth && (
                                        <p className="text-xs text-muted-foreground">
                                            Date of birth cannot be changed once set.
                                        </p>
                                    )}
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
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 bg-muted/50 rounded-lg">
                                <span className={`break-all ${user?.email ? "" : "text-muted-foreground italic"}`}>
                                    {user?.email || "No email linked"}
                                </span>
                                {user?.isEmailLinked && (
                                    <Badge variant="outline" className="w-fit bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 shrink-0">
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

                        <Separator />

                        {/* Name (System Username) Section - De-emphasized */}
                        <div className="space-y-2">
                            <button
                                type="button"
                                onClick={() => setIsUsernameExpanded(!isUsernameExpanded)}
                                className="flex items-center justify-between w-full text-left group"
                            >
                                <Label htmlFor="username" className="text-sm text-muted-foreground font-normal cursor-pointer group-hover:text-foreground transition-colors">
                                    Name
                                    <span className="text-xs ml-2 opacity-60">(for system use)</span>
                                </Label>
                                <motion.div
                                    animate={{ rotate: isUsernameExpanded ? 180 : 0 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <ChevronRight className="w-4 h-4 text-muted-foreground rotate-90" />
                                </motion.div>
                            </button>

                            <AnimatePresence>
                                {isUsernameExpanded && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="pt-2">
                                            {isEditingUsername ? (
                                                <div className="space-y-3">
                                                    <Input
                                                        id="username"
                                                        value={userName}
                                                        onChange={(e) => {
                                                            setUserName(e.target.value);
                                                            setUserNameError("");
                                                        }}
                                                        placeholder="Enter new username"
                                                        className={userNameError ? "border-red-500 focus-visible:ring-red-500" : ""}
                                                        disabled={isUpdatingUsername}
                                                    />
                                                    {userNameError && (
                                                        <div className="flex items-center gap-2 text-sm text-red-600">
                                                            <AlertCircle className="w-4 h-4" />
                                                            {userNameError}
                                                        </div>
                                                    )}
                                                    <p className="text-xs text-muted-foreground">
                                                        Letters, numbers, and underscores only (3-30 characters)
                                                    </p>
                                                    <div className="flex gap-2">
                                                        <Button
                                                            onClick={handleSaveUsername}
                                                            disabled={isUpdatingUsername || !userName.trim()}
                                                            size="sm"
                                                        >
                                                            {isUpdatingUsername ? (
                                                                <>
                                                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                                    Saving...
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <CheckCircle className="w-4 h-4 mr-2" />
                                                                    Save
                                                                </>
                                                            )}
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            onClick={handleCancelUsername}
                                                            disabled={isUpdatingUsername}
                                                            size="sm"
                                                        >
                                                            Cancel
                                                        </Button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                                                    <span className="text-sm text-muted-foreground">{user?.userName}</span>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => setIsEditingUsername(true)}
                                                        className="text-xs text-muted-foreground hover:text-foreground h-7 px-2"
                                                    >
                                                        <Edit2 className="w-3 h-3 mr-1" />
                                                        Edit
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
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
                            {user?.player?.isBanned && (
                                <div className="p-4 bg-muted/30 rounded-lg">
                                    <p className="text-sm text-muted-foreground mb-1">Player Status</p>
                                    <Badge variant="destructive">Banned</Badge>
                                </div>
                            )}
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
            </div >
        </>
    );
}

