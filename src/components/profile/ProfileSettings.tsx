"use client";

import { useState, useEffect, useRef } from "react";
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
import { Loader2, User, Mail, Shield, AlertCircle, CheckCircle, Edit2, Gamepad2, HelpCircle, ChevronLeft, ChevronRight, Check, Calendar } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ProfileImageSelector } from "@/src/components/profile/ProfileImageSelector";

// Tutorial steps with images (same as onboarding)
const TUTORIAL_STEPS = [
    {
        image: "/images/ign-step-1.png",
        title: "Step 1: Open Profile",
        description: "Click ha avatar/profile icon ha top left corner",
    },
    {
        image: "/images/ign-step-2.png",
        title: "Step 2: Copy IGN",
        description: "Click ha kyrteng bad copy ia u",
    },
];

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

    // Help modal state
    const [showHelpModal, setShowHelpModal] = useState(false);
    const [isClosing, setIsClosing] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [buttonPosition, setButtonPosition] = useState({ x: 0, y: 0 });
    const helpButtonRef = useRef<HTMLButtonElement>(null);

    // Function to open modal and capture button position
    const openHelpModal = () => {
        if (helpButtonRef.current) {
            const rect = helpButtonRef.current.getBoundingClientRect();
            setButtonPosition({
                x: rect.left + rect.width / 2,
                y: rect.top + rect.height / 2,
            });
        }
        setIsClosing(false);
        setShowHelpModal(true);
    };

    // Function to close modal with animation
    const closeHelpModal = () => {
        if (helpButtonRef.current) {
            const rect = helpButtonRef.current.getBoundingClientRect();
            setButtonPosition({
                x: rect.left + rect.width / 2,
                y: rect.top + rect.height / 2,
            });
        }
        setIsClosing(true);
        setTimeout(() => {
            setShowHelpModal(false);
            setIsClosing(false);
        }, 400);
    };

    // Reset to step 0 when modal opens
    useEffect(() => {
        if (showHelpModal) {
            setCurrentStep(0);
        }
    }, [showHelpModal]);

    const nextStep = () => {
        if (currentStep < TUTORIAL_STEPS.length - 1) {
            setCurrentStep(currentStep + 1);
        }
    };

    const prevStep = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const currentTutorial = TUTORIAL_STEPS[currentStep];
    const isLastStep = currentStep === TUTORIAL_STEPS.length - 1;

    // Calculate the origin transform for the genie effect
    const getTransformOrigin = () => {
        if (typeof window === 'undefined') return 'center center';
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        const offsetX = buttonPosition.x - centerX;
        const offsetY = buttonPosition.y - centerY;
        return `calc(50% + ${offsetX}px) calc(50% + ${offsetY}px)`;
    };

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

    const validateDisplayName = (value: string) => {
        if (value.length < 2) {
            return "IGN must be at least 2 characters";
        }
        if (value.length > 50) {
            return "IGN must be at most 50 characters";
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
            {/* IGN Help Modal */}
            <AnimatePresence>
                {showHelpModal && (
                    <div className="fixed inset-0 z-50">
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: isClosing ? 0 : 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3, ease: "easeOut" }}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                            onClick={closeHelpModal}
                        />

                        {/* Modal */}
                        <div className="absolute inset-0 flex items-end sm:items-center justify-center p-4 pointer-events-none">
                            <motion.div
                                initial={{ opacity: 0, scale: 0 }}
                                animate={{
                                    opacity: isClosing ? 0 : 1,
                                    scale: isClosing ? 0 : 1,
                                    transition: isClosing
                                        ? { duration: 0.4, ease: [0.32, 0, 0.67, 0] }
                                        : { type: "spring", damping: 20, stiffness: 300, mass: 0.5 }
                                }}
                                exit={{ opacity: 0, scale: 0 }}
                                style={{ transformOrigin: getTransformOrigin() }}
                                className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md pointer-events-auto overflow-hidden"
                            >
                                {/* Header */}
                                <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                                            <HelpCircle className="w-4 h-4 text-white" />
                                        </div>
                                        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                                            Kumno ban copy IGN
                                        </h2>
                                    </div>
                                    <button
                                        onClick={closeHelpModal}
                                        className="w-8 h-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center transition-colors"
                                    >
                                        <span className="text-xl text-slate-500">×</span>
                                    </button>
                                </div>

                                {/* Content */}
                                <div className="p-4">
                                    {/* Image Carousel */}
                                    <div className="relative">
                                        <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800">
                                            <AnimatePresence mode="wait">
                                                <motion.img
                                                    key={currentStep}
                                                    src={currentTutorial.image}
                                                    alt={currentTutorial.title}
                                                    initial={{ opacity: 0, x: 20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    exit={{ opacity: 0, x: -20 }}
                                                    transition={{ duration: 0.2 }}
                                                    className="w-full h-full object-contain"
                                                />
                                            </AnimatePresence>
                                        </div>

                                        {/* Navigation Arrows */}
                                        <motion.button
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={prevStep}
                                            disabled={currentStep === 0}
                                            className={`absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center transition-colors ${currentStep === 0
                                                ? "bg-slate-200/50 dark:bg-slate-700/50 text-slate-400 cursor-not-allowed"
                                                : "bg-white dark:bg-slate-700 shadow-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/50 text-slate-700 dark:text-slate-200"
                                                }`}
                                        >
                                            <ChevronLeft className="w-5 h-5" />
                                        </motion.button>
                                        <motion.button
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={nextStep}
                                            disabled={isLastStep}
                                            className={`absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isLastStep
                                                ? "bg-slate-200/50 dark:bg-slate-700/50 text-slate-400 cursor-not-allowed"
                                                : "bg-white dark:bg-slate-700 shadow-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/50 text-slate-700 dark:text-slate-200"
                                                }`}
                                        >
                                            <ChevronRight className="w-5 h-5" />
                                        </motion.button>
                                    </div>

                                    {/* Step Info */}
                                    <AnimatePresence mode="wait">
                                        <motion.div
                                            key={currentStep}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            transition={{ duration: 0.2 }}
                                            className="mt-4 text-center"
                                        >
                                            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                                                {currentTutorial.title}
                                            </h3>
                                            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                                                {currentTutorial.description}
                                            </p>
                                        </motion.div>
                                    </AnimatePresence>

                                    {/* Step Indicators */}
                                    <div className="flex justify-center gap-3 mt-4">
                                        {TUTORIAL_STEPS.map((_, index) => (
                                            <motion.button
                                                key={index}
                                                onClick={() => setCurrentStep(index)}
                                                animate={{
                                                    width: index === currentStep ? 32 : 8,
                                                }}
                                                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                                                className={`h-2 rounded-full ${index === currentStep
                                                    ? "bg-gradient-to-r from-indigo-500 to-purple-600"
                                                    : "bg-slate-300 dark:bg-slate-600 hover:bg-slate-400"
                                                    }`}
                                            />
                                        ))}
                                    </div>

                                    <Button
                                        onClick={closeHelpModal}
                                        className="w-full mt-5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 py-3 text-base font-medium"
                                    >
                                        <Check className="w-5 h-5 mr-2" />
                                        Got it!
                                    </Button>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                )}
            </AnimatePresence>

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
                            <div className="flex items-center gap-2">
                                <Label htmlFor="displayName" className="text-base font-medium flex items-center gap-2">
                                    <Gamepad2 className="w-4 h-4" />
                                    Game Name
                                    <motion.button
                                        ref={helpButtonRef}
                                        type="button"
                                        onClick={openHelpModal}
                                        className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-md hover:shadow-indigo-500/50 transition-shadow"
                                        title="How to find your IGN"
                                        animate={isClosing ? {
                                            scale: [1, 1.5, 1.2],
                                            rotate: [0, 180],
                                        } : {
                                            scale: [1, 1.05, 1],
                                        }}
                                        transition={isClosing ? {
                                            duration: 0.5,
                                            ease: "easeOut"
                                        } : {
                                            duration: 2,
                                            repeat: Infinity,
                                            repeatDelay: 2
                                        }}
                                        whileHover={{ scale: 1.15 }}
                                        whileTap={{ scale: 0.9 }}
                                    >
                                        <HelpCircle className="w-3 h-3" />
                                    </motion.button>
                                </Label>
                            </div>

                            <Input
                                id="displayName"
                                value={displayName}
                                onChange={(e) => {
                                    setDisplayName(e.target.value);
                                    setDisplayNameError("");
                                }}
                                onPaste={(e) => {
                                    e.preventDefault();
                                    const pastedText = e.clipboardData.getData("text");
                                    // Replace BGMI invisible characters (macron vowels) with spaces
                                    const sanitized = pastedText
                                        .replace(/[ĀāĒēĪīŌōŪū]/g, " ")
                                        .replace(/\s+/g, " ");
                                    setDisplayName(sanitized);
                                    setDisplayNameError("");
                                }}
                                placeholder="e.g. KŠツMeban"
                                className={displayNameError ? "border-red-500 focus-visible:ring-red-500" : ""}
                                disabled={isUpdatingDisplayName}
                            />

                            {displayNameError && (
                                <div className="flex items-center gap-2 text-sm text-red-600">
                                    <AlertCircle className="w-4 h-4" />
                                    {displayNameError}
                                </div>
                            )}

                            <p className="text-xs text-muted-foreground">
                                This is shown everywhere in the app. Special characters allowed (2-50 characters)
                            </p>

                            {/* Show Cancel/Save buttons only when there are changes */}
                            {displayName !== (user?.displayName || "") && displayName.trim() && (
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        onClick={() => setDisplayName(user?.displayName || "")}
                                        disabled={isUpdatingDisplayName}
                                        size="sm"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={handleSaveDisplayName}
                                        disabled={isUpdatingDisplayName}
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
            </div >
        </>
    );
}

