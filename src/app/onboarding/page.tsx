"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import http from "@/src/utils/http";
import { useAuth } from "@/src/hooks/context/auth/useAuth";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { LoaderFive } from "@/src/components/ui/loader";
import { FiUser, FiCheck, FiAlertCircle, FiHelpCircle, FiChevronLeft, FiChevronRight } from "react-icons/fi";



// Tutorial steps with images
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

export default function OnboardingPage() {
    const { user, refreshAuth } = useAuth();
    const { user: clerkUser } = useUser();
    const router = useRouter();
    const [userName, setUserName] = useState("");
    const [displayName, setDisplayName] = useState("");
    const [dateOfBirth, setDateOfBirth] = useState("");
    const [userNameError, setUserNameError] = useState("");
    const [displayNameError, setDisplayNameError] = useState("");
    const [showHelpModal, setShowHelpModal] = useState(false);
    const [isClosing, setIsClosing] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [buttonPosition, setButtonPosition] = useState({ x: 0, y: 0 });
    const helpButtonRef = useRef<HTMLButtonElement>(null);

    // Auto-fill username with first name from Google
    useEffect(() => {
        if (clerkUser?.firstName && !userName) {
            // Sanitize: only allow alphanumeric and underscore, convert to lowercase
            const sanitized = clerkUser.firstName
                .toLowerCase()
                .replace(/[^a-z0-9_]/g, "");
            if (sanitized.length >= 3) {
                setUserName(sanitized);
            }
        }
    }, [clerkUser?.firstName, userName]);

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

    // Function to close modal with animation (always closes to button position)
    const closeHelpModal = () => {
        // Recapture button position so animation always goes to the "?" button
        if (helpButtonRef.current) {
            const rect = helpButtonRef.current.getBoundingClientRect();
            setButtonPosition({
                x: rect.left + rect.width / 2,
                y: rect.top + rect.height / 2,
            });
        }
        setIsClosing(true);
        // Delay hiding modal to allow exit animation to complete
        setTimeout(() => {
            setShowHelpModal(false);
            setIsClosing(false);
        }, 400);
    };

    // Auto-open help modal on first load
    useEffect(() => {
        // Small delay to let the page render first
        const timer = setTimeout(() => {
            // For auto-open, use center of screen as origin
            setButtonPosition({
                x: window.innerWidth / 2,
                y: window.innerHeight / 2,
            });
            setShowHelpModal(true);
        }, 500);
        return () => clearTimeout(timer);
    }, []);

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

    // Validation for simple username (alphanumeric + underscore)
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

    // Validation for display name (any Unicode, just length check)
    const validateDisplayName = (value: string) => {
        if (value.length < 2) {
            return "IGN must be at least 2 characters";
        }
        if (value.length > 50) {
            return "IGN must be at most 50 characters";
        }
        return "";
    };

    const { mutate: submitUsernames, isPending } = useMutation({
        mutationFn: (data: { userName: string; displayName: string; dateOfBirth?: string }) =>
            http.post("/onboarding", data),
        onSuccess: () => {
            toast.success("Welcome to PUBGMI Tournament! Your account is ready.");
            refreshAuth();
            router.push("/?welcome=1");
        },
        onError: (err: { response?: { data?: { message?: string } } }) => {
            const message =
                err?.response?.data?.message || "Failed to set username. Please try again.";
            setUserNameError(message);
            toast.error(message);
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const usernameError = validateUsername(userName);
        const displayError = validateDisplayName(displayName);

        if (usernameError) {
            setUserNameError(usernameError);
        }
        if (displayError) {
            setDisplayNameError(displayError);
        }

        if (usernameError || displayError) {
            return;
        }

        setUserNameError("");
        setDisplayNameError("");
        submitUsernames({
            userName,
            displayName,
            ...(dateOfBirth && { dateOfBirth }),
        });
    };

    // If user is already onboarded, redirect to home
    if (user?.isOnboarded) {
        router.push("/");
        return null;
    }

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

    return (
        <>
            {/* Framer Motion Animated Help Modal with Genie Effect */}
            <AnimatePresence>
                {showHelpModal && (
                    <div className="fixed inset-0 z-50">
                        {/* Backdrop with fade animation */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: isClosing ? 0 : 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3, ease: "easeOut" }}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                            onClick={closeHelpModal}
                        />

                        {/* Modal with genie animation from button position */}
                        <div className="absolute inset-0 flex items-end sm:items-center justify-center p-4 pointer-events-none">
                            <motion.div
                                initial={{
                                    opacity: 0,
                                    scale: 0,
                                }}
                                animate={{
                                    opacity: isClosing ? 0 : 1,
                                    scale: isClosing ? 0 : 1,
                                    transition: isClosing
                                        ? { duration: 0.4, ease: [0.32, 0, 0.67, 0] }
                                        : { type: "spring", damping: 20, stiffness: 300, mass: 0.5 }
                                }}
                                exit={{
                                    opacity: 0,
                                    scale: 0,
                                    transition: {
                                        duration: 0.4,
                                        ease: [0.32, 0, 0.67, 0],
                                    }
                                }}
                                style={{
                                    transformOrigin: getTransformOrigin(),
                                }}
                                className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md pointer-events-auto overflow-hidden"
                            >
                                {/* Header */}
                                <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
                                    <div className="flex items-center gap-2">
                                        <motion.div
                                            initial={{ rotate: -180, scale: 0 }}
                                            animate={{ rotate: 0, scale: 1 }}
                                            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                                            className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center"
                                        >
                                            <FiHelpCircle className="w-4 h-4 text-white" />
                                        </motion.div>
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
                                        {/* Step Image with animation */}
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
                                            <FiChevronLeft className="w-5 h-5" />
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
                                            <FiChevronRight className="w-5 h-5" />
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

                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.3 }}
                                    >
                                        <Button
                                            onClick={closeHelpModal}
                                            className="w-full mt-5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 py-3 text-base font-medium"
                                        >
                                            <FiCheck className="w-5 h-5 mr-2" />
                                            Got it!
                                        </Button>
                                    </motion.div>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                )}
            </AnimatePresence>

            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 px-4">
                <div className="w-full max-w-md">
                    {/* Header Card */}
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 border border-slate-200 dark:border-slate-700">
                        {/* Icon */}
                        <div className="flex justify-center mb-6">
                            <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                                <FiUser className="w-8 h-8 text-white" />
                            </div>
                        </div>

                        {/* Title */}
                        <h1 className="text-2xl font-bold text-center text-slate-800 dark:text-slate-200 mb-2">
                            Set Your Usernames
                        </h1>

                        {/* Description */}
                        <p className="text-center text-slate-600 dark:text-slate-400 mb-6">
                            Thoh kyrteng <span className="font-semibold text-indigo-600 dark:text-indigo-400">kumjuh ha BGMI (IGN)</span>.
                        </p>

                        {/* Important notice */}
                        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-4 mb-6">
                            <div className="flex gap-3">
                                <FiAlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                                <div className="text-sm text-amber-700 dark:text-amber-300">
                                    <p className="font-medium mb-1">Balei ban thoh da kyrteng kumjuh na bgmi?</p>
                                    <p>Ban suk ban thoh points bad ban ym shah kick ha room</p>
                                </div>
                            </div>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* Simple Username */}
                            <div>
                                <label
                                    htmlFor="username"
                                    className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
                                >
                                    Name
                                </label>
                                <Input
                                    id="username"
                                    type="text"
                                    value={userName}
                                    onChange={(e) => {
                                        setUserName(e.target.value);
                                        setUserNameError("");
                                    }}
                                    placeholder="e.g. meban_ks"
                                    className={`w-full ${userNameError
                                        ? "border-red-500 focus-visible:ring-red-500"
                                        : "focus-visible:ring-indigo-500"
                                        }`}
                                    disabled={isPending}
                                    autoFocus
                                />
                                {userNameError && (
                                    <p className="mt-2 text-sm text-red-500 flex items-center gap-1">
                                        <FiAlertCircle className="w-4 h-4" />
                                        {userNameError}
                                    </p>
                                )}
                                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                                    3-30 characters. Letters, numbers, and underscores only.
                                </p>
                            </div>

                            {/* Display Name (BGMI IGN) */}
                            <div>
                                <label
                                    htmlFor="displayName"
                                    className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
                                >
                                    Game Name
                                    <motion.button
                                        ref={helpButtonRef}
                                        type="button"
                                        onClick={openHelpModal}
                                        className="relative inline-flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg hover:shadow-indigo-500/50 transition-shadow"
                                        title="How to find your IGN"
                                        animate={isClosing ? {
                                            scale: [1, 1.5, 1.2],
                                            rotate: [0, 180],
                                            boxShadow: [
                                                "0 0 0 0 rgba(99, 102, 241, 0)",
                                                "0 0 20px 10px rgba(99, 102, 241, 0.6)",
                                                "0 0 0 0 rgba(99, 102, 241, 0)"
                                            ]
                                        } : {
                                            scale: [1, 1.1, 1],
                                            rotate: 0,
                                            boxShadow: [
                                                "0 0 0 0 rgba(99, 102, 241, 0.4)",
                                                "0 0 0 8px rgba(99, 102, 241, 0)",
                                                "0 0 0 0 rgba(99, 102, 241, 0)"
                                            ]
                                        }}
                                        transition={isClosing ? {
                                            duration: 0.5,
                                            ease: "easeOut"
                                        } : {
                                            duration: 2,
                                            repeat: Infinity,
                                            repeatDelay: 1
                                        }}
                                        whileHover={{ scale: 1.2 }}
                                        whileTap={{ scale: 0.9 }}
                                    >
                                        <FiHelpCircle className="w-3.5 h-3.5" />
                                    </motion.button>
                                </label>
                                <Input
                                    id="displayName"
                                    type="text"
                                    value={displayName}
                                    onChange={(e) => {
                                        setDisplayName(e.target.value);
                                        setDisplayNameError("");
                                    }}
                                    placeholder="e.g. KŠツMeban"
                                    className={`w-full ${displayNameError
                                        ? "border-red-500 focus-visible:ring-red-500"
                                        : "focus-visible:ring-indigo-500"
                                        }`}
                                    disabled={isPending}
                                />
                                {displayNameError && (
                                    <p className="mt-2 text-sm text-red-500 flex items-center gap-1">
                                        <FiAlertCircle className="w-4 h-4" />
                                        {displayNameError}
                                    </p>
                                )}
                                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                                    Enter exactly as shown in BGMI. Special characters allowed.
                                </p>
                            </div>

                            {/* Date of Birth (Optional) */}
                            <div>
                                <label
                                    htmlFor="dateOfBirth"
                                    className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
                                >
                                    Date of Birth <span className="text-slate-400">(Optional)</span>
                                </label>
                                <Input
                                    id="dateOfBirth"
                                    type="date"
                                    value={dateOfBirth}
                                    onChange={(e) => setDateOfBirth(e.target.value)}
                                    max={new Date().toISOString().split('T')[0]}
                                    className="w-full focus-visible:ring-indigo-500"
                                    disabled={isPending}
                                />
                                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                                    🎁 Add your birthday for free entry fee for the current tournament!
                                </p>
                            </div>

                            <Button
                                type="submit"
                                disabled={isPending || !userName.trim() || !displayName.trim()}
                                className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-medium py-2.5"
                            >
                                {isPending ? (
                                    <LoaderFive text="Setting up..." />
                                ) : (
                                    <>
                                        <FiCheck className="w-4 h-4 mr-2" />
                                        Continue to Tournament
                                    </>
                                )}
                            </Button>
                        </form>
                    </div>

                    {/* Footer text */}
                    <p className="text-center text-xs text-slate-500 dark:text-slate-400 mt-4">
                        Phi lah ban change biang na profile page
                    </p>
                </div>
            </div>
        </>
    );
}
