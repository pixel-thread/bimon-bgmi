"use client";

import { useState } from "react";
import { toast } from "sonner";
import { FiClipboard, FiX, FiAlertCircle } from "react-icons/fi";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { IGNTutorial } from "@/src/components/common/IGNTutorialModal";

const MAX_IGN_LENGTH = 14;

interface GameNameInputProps {
    value: string;
    onChange: (value: string) => void;
    error?: string;
    onErrorChange?: (error: string) => void;
    disabled?: boolean;
    /** Whether to auto-open the tutorial on mount (for onboarding) */
    autoOpenTutorial?: boolean;
    /** Button size for the help button */
    tutorialButtonSize?: 'sm' | 'md';
    /** Whether to show as read-only paste field (onboarding style) or editable (profile style) */
    readOnly?: boolean;
    /** Label text */
    label?: string;
    /** Force show error even if not touched (used when form is submitted) */
    forceShowError?: boolean;
}

export function GameNameInput({
    value,
    onChange,
    error,
    onErrorChange,
    disabled = false,
    autoOpenTutorial = false,
    tutorialButtonSize = 'md',
    readOnly = true,
    label = "Game Name",
    forceShowError = false,
}: GameNameInputProps) {
    const ignTutorial = IGNTutorial({ autoOpen: autoOpenTutorial, buttonSize: tutorialButtonSize });
    const [touched, setTouched] = useState(false);

    const handlePaste = async () => {
        // Clear error first to prevent flash
        onErrorChange?.("");
        setTouched(true);
        try {
            const text = await navigator.clipboard.readText();
            if (text.trim()) {
                const trimmed = text.trim();
                // Reject if longer than max chars (BGMI max IGN length)
                if (trimmed.length > MAX_IGN_LENGTH) {
                    toast.error("Name too long! Please copy your actual IGN from BGMI.");
                    return;
                }
                onChange(trimmed);
                // Validate min length and show error if too short
                if (trimmed.length < 2) {
                    onErrorChange?.("Game Name must be at least 2 characters");
                } else {
                    toast.success("Game Name pasted!");
                }
            } else {
                toast.error("Clipboard is empty");
            }
        } catch {
            toast.error("Cannot access clipboard. Please allow clipboard permission.");
        }
    };

    const handleClear = () => {
        // Clear error first to prevent flash
        onErrorChange?.("");
        setTouched(true);
        onChange("");
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!readOnly) {
            setTouched(true);
            const newValue = e.target.value;
            onChange(newValue);
            onErrorChange?.("");
        }
    };

    const handleInputPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        if (!readOnly) {
            e.preventDefault();
            setTouched(true);
            const pastedText = e.clipboardData.getData("text");
            // Replace BGMI invisible characters (macron vowels) with spaces
            const sanitized = pastedText
                .replace(/[ĀāĒēĪīŌōŪū]/g, " ")
                .replace(/\s+/g, " ")
                .trim();
            // Reject if longer than max chars
            if (sanitized.length > MAX_IGN_LENGTH) {
                toast.error("Name too long! Please copy your actual IGN from BGMI.");
                return;
            }
            onChange(sanitized);
            onErrorChange?.("");
        }
    };

    // Only show error if touched or forced (on form submit)
    const showError = error && (touched || forceShowError);

    return (
        <>
            {/* Tutorial Modal */}
            {ignTutorial.Modal}

            <div>
                <label
                    htmlFor="gameName"
                    className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
                >
                    {label}
                    {ignTutorial.HelpButton}
                </label>

                {readOnly ? (
                    // Onboarding style: read-only with paste/clear buttons
                    <div className="flex gap-2">
                        <Input
                            id="gameName"
                            type="text"
                            value={value}
                            readOnly
                            placeholder="Paste here"
                            className={`w-full bg-slate-50 dark:bg-slate-700/50 cursor-default ${showError
                                ? "border-red-500 focus-visible:ring-red-500"
                                : "focus-visible:ring-indigo-500"
                                }`}
                            disabled={disabled}
                        />
                        {value ? (
                            <Button
                                type="button"
                                onClick={handleClear}
                                disabled={disabled}
                                className="bg-red-500 hover:bg-red-600 text-white px-4"
                            >
                                <FiX className="w-4 h-4 mr-1" />
                                Clear
                            </Button>
                        ) : (
                            <Button
                                type="button"
                                onClick={handlePaste}
                                disabled={disabled}
                                className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-4"
                            >
                                <FiClipboard className="w-4 h-4 mr-1" />
                                Paste
                            </Button>
                        )}
                    </div>
                ) : (
                    // Profile style: editable input
                    <Input
                        id="gameName"
                        value={value}
                        onChange={handleInputChange}
                        onPaste={handleInputPaste}
                        placeholder="Enter your Game Name"
                        className={showError ? "border-red-500 focus-visible:ring-red-500" : ""}
                        disabled={disabled}
                    />
                )}

                {showError && (
                    <p className="mt-2 text-sm text-red-500 flex items-center gap-1">
                        <FiAlertCircle className="w-4 h-4" />
                        {error}
                    </p>
                )}

                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                    <button
                        type="button"
                        onClick={ignTutorial.openModal}
                        className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                    >
                        Kumno ban copy?
                    </button>
                    {" / "}
                    <button
                        type="button"
                        onClick={ignTutorial.openModal}
                        className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                    >
                        Need help?
                    </button>
                </p>
            </div>
        </>
    );
}

/**
 * Validation function for display name
 */
export function validateDisplayName(value: string): string {
    if (value.length < 2) {
        return "Game Name must be at least 2 characters";
    }
    if (value.length > MAX_IGN_LENGTH) {
        return `Game Name must be at most ${MAX_IGN_LENGTH} characters`;
    }
    return "";
}

export { MAX_IGN_LENGTH };
