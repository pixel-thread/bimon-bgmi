"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiHelpCircle, FiChevronLeft, FiChevronRight, FiCheck } from "react-icons/fi";
import { Button } from "@/src/components/ui/button";

// Tutorial steps with images
const TUTORIAL_STEPS = [
    {
        image: "/images/ign-step-1.png",
        title: "Step 1: Open Profile",
        description: "Click the avatar/profile icon on top left corner",
    },
    {
        image: "/images/ign-step-2.png",
        title: "Step 2: Copy Game Name",
        description: "Click the 📋 icon to copy your game name",
    },
];

interface IGNTutorialModalProps {
    /** Whether to auto-open the modal on first load */
    autoOpen?: boolean;
    /** Size of the help button - 'sm' for profile, 'md' for onboarding */
    buttonSize?: 'sm' | 'md';
    /** Optional className for the button container */
    className?: string;
}

export function IGNTutorialModal({
    autoOpen = false,
    buttonSize = 'md',
    className = ''
}: IGNTutorialModalProps) {
    const [showHelpModal, setShowHelpModal] = useState(false);
    const [isClosing, setIsClosing] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [buttonPosition, setButtonPosition] = useState({ x: 0, y: 0 });
    const helpButtonRef = useRef<HTMLButtonElement>(null);

    // Auto-open help modal on first load (if enabled)
    useEffect(() => {
        if (autoOpen) {
            const timer = setTimeout(() => {
                // For auto-open, use center of screen as origin
                setButtonPosition({
                    x: window.innerWidth / 2,
                    y: window.innerHeight / 2,
                });
                setShowHelpModal(true);
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [autoOpen]);

    // Reset to step 0 when modal opens
    useEffect(() => {
        if (showHelpModal) {
            setCurrentStep(0);
        }
    }, [showHelpModal]);

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

    // Button size classes
    const buttonSizeClasses = buttonSize === 'sm'
        ? 'w-5 h-5'
        : 'w-6 h-6';
    const iconSizeClasses = buttonSize === 'sm'
        ? 'w-3 h-3'
        : 'w-3.5 h-3.5';

    return (
        <>
            {/* Help Button */}
            <motion.button
                ref={helpButtonRef}
                type="button"
                onClick={openHelpModal}
                className={`relative inline-flex items-center justify-center ${buttonSizeClasses} rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg hover:shadow-indigo-500/50 transition-shadow ${className}`}
                title="How to find your IGN"
                animate={isClosing ? {
                    scale: [1, 1.5, 1.2],
                    boxShadow: [
                        "0 0 0 0 rgba(99, 102, 241, 0)",
                        "0 0 20px 10px rgba(99, 102, 241, 0.6)",
                        "0 0 0 0 rgba(99, 102, 241, 0)"
                    ]
                } : {
                    scale: [1, 1.1, 1],
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
                <FiHelpCircle className={iconSizeClasses} />
            </motion.button>

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
                            onClick={isLastStep ? closeHelpModal : undefined}
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
                                            How to copy game name
                                        </h2>
                                    </div>
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
                                                <motion.div
                                                    key={index}
                                                    animate={{
                                                        width: index === currentStep ? 32 : 8,
                                                    }}
                                                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                                                    className={`h-2 rounded-full ${index === currentStep
                                                        ? "bg-gradient-to-r from-indigo-500 to-purple-600"
                                                        : "bg-slate-300 dark:bg-slate-600"
                                                        }`}
                                                />
                                            ))}
                                        </div>

                                        {/* Navigation Buttons */}
                                        <div className="flex gap-3 mt-5">
                                            {isLastStep ? (
                                                <>
                                                    <Button
                                                        onClick={prevStep}
                                                        className="flex-1 bg-gradient-to-l from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 py-3 text-base font-medium text-white"
                                                    >
                                                        <FiChevronLeft className="w-5 h-5" />
                                                    </Button>
                                                    <Button
                                                        onClick={closeHelpModal}
                                                        className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 py-3 text-base font-medium text-white"
                                                    >
                                                        <FiCheck className="w-5 h-5 mr-1" />
                                                        Got it!
                                                    </Button>
                                                </>
                                            ) : (
                                                <Button
                                                    onClick={nextStep}
                                                    className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 py-3 text-base font-medium text-white"
                                                >
                                                    Next
                                                    <FiChevronRight className="w-5 h-5 ml-1" />
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}

/** 
 * A text link that opens the IGN tutorial modal 
 * Used below the Game Name input field
 */
interface IGNTutorialLinkProps {
    /** Callback to open the modal */
    onOpenModal: () => void;
}

export function IGNTutorialLink({ onOpenModal }: IGNTutorialLinkProps) {
    return (
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            <button
                type="button"
                onClick={onOpenModal}
                className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
            >
                Kumno ban copy?
            </button>
            {" / "}
            <button
                type="button"
                onClick={onOpenModal}
                className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
            >
                Need help?
            </button>
        </p>
    );
}

/**
 * Combined component with button and link - for use in forms
 */
interface IGNTutorialProps {
    /** Whether to auto-open the modal on first load */
    autoOpen?: boolean;
    /** Size of the help button */
    buttonSize?: 'sm' | 'md';
    /** Whether to show the help link below */
    showHelpLink?: boolean;
}

export function IGNTutorial({
    autoOpen = false,
    buttonSize = 'md',
    showHelpLink = false
}: IGNTutorialProps) {
    const [showHelpModal, setShowHelpModal] = useState(false);
    const [isClosing, setIsClosing] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [buttonPosition, setButtonPosition] = useState({ x: 0, y: 0 });
    const helpButtonRef = useRef<HTMLButtonElement>(null);

    // Auto-open help modal on first load (if enabled)
    useEffect(() => {
        if (autoOpen) {
            const timer = setTimeout(() => {
                setButtonPosition({
                    x: window.innerWidth / 2,
                    y: window.innerHeight / 2,
                });
                setShowHelpModal(true);
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [autoOpen]);

    // Reset to step 0 when modal opens
    useEffect(() => {
        if (showHelpModal) {
            setCurrentStep(0);
        }
    }, [showHelpModal]);

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

    const getTransformOrigin = () => {
        if (typeof window === 'undefined') return 'center center';
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        const offsetX = buttonPosition.x - centerX;
        const offsetY = buttonPosition.y - centerY;
        return `calc(50% + ${offsetX}px) calc(50% + ${offsetY}px)`;
    };

    const buttonSizeClasses = buttonSize === 'sm' ? 'w-5 h-5' : 'w-6 h-6';
    const iconSizeClasses = buttonSize === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5';

    return {
        HelpButton: (
            <motion.button
                ref={helpButtonRef}
                type="button"
                onClick={openHelpModal}
                className={`relative inline-flex items-center justify-center ${buttonSizeClasses} rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg hover:shadow-indigo-500/50 transition-shadow`}
                title="How to find your IGN"
                animate={isClosing ? {
                    scale: [1, 1.5, 1.2],
                    boxShadow: [
                        "0 0 0 0 rgba(99, 102, 241, 0)",
                        "0 0 20px 10px rgba(99, 102, 241, 0.6)",
                        "0 0 0 0 rgba(99, 102, 241, 0)"
                    ]
                } : {
                    scale: [1, 1.1, 1],
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
                <FiHelpCircle className={iconSizeClasses} />
            </motion.button>
        ),
        HelpLink: showHelpLink ? (
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                <button
                    type="button"
                    onClick={openHelpModal}
                    className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                >
                    Kumno ban copy?
                </button>
                {" / "}
                <button
                    type="button"
                    onClick={openHelpModal}
                    className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                >
                    Need help?
                </button>
            </p>
        ) : null,
        Modal: (
            <AnimatePresence>
                {showHelpModal && (
                    <div className="fixed inset-0 z-50">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: isClosing ? 0 : 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3, ease: "easeOut" }}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                            onClick={isLastStep ? closeHelpModal : undefined}
                        />

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
                                            How to copy game name
                                        </h2>
                                    </div>
                                </div>

                                <div className="p-4">
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

                                        <div className="flex justify-center gap-3 mt-4">
                                            {TUTORIAL_STEPS.map((_, index) => (
                                                <motion.div
                                                    key={index}
                                                    animate={{ width: index === currentStep ? 32 : 8 }}
                                                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                                                    className={`h-2 rounded-full ${index === currentStep
                                                        ? "bg-gradient-to-r from-indigo-500 to-purple-600"
                                                        : "bg-slate-300 dark:bg-slate-600"
                                                        }`}
                                                />
                                            ))}
                                        </div>

                                        <div className="flex gap-3 mt-5">
                                            {isLastStep ? (
                                                <>
                                                    <Button
                                                        onClick={prevStep}
                                                        className="flex-1 bg-gradient-to-l from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 py-3 text-base font-medium text-white"
                                                    >
                                                        <FiChevronLeft className="w-5 h-5" />
                                                    </Button>
                                                    <Button
                                                        onClick={closeHelpModal}
                                                        className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 py-3 text-base font-medium text-white"
                                                    >
                                                        <FiCheck className="w-5 h-5 mr-1" />
                                                        Got it!
                                                    </Button>
                                                </>
                                            ) : (
                                                <Button
                                                    onClick={nextStep}
                                                    className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 py-3 text-base font-medium text-white"
                                                >
                                                    Next
                                                    <FiChevronRight className="w-5 h-5 ml-1" />
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                )}
            </AnimatePresence>
        ),
        openModal: openHelpModal,
    };
}
