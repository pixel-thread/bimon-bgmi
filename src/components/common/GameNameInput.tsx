"use client";

import { useState } from "react";
import { toast } from "sonner";
import { FiClipboard, FiX, FiAlertCircle } from "react-icons/fi";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { IGNTutorial } from "@/src/components/common/IGNTutorialModal";

const MAX_IGN_LENGTH = 20;

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
    const [clipboardDenied, setClipboardDenied] = useState(false);

    const handlePaste = async () => {
        // Clear error first to prevent flash
        onErrorChange?.("");
        setTouched(true);
        try {
            const text = await navigator.clipboard.readText();
            if (text.trim()) {
                processPastedText(text);
            } else {
                toast.error("Clipboard is empty");
            }
        } catch {
            setClipboardDenied(true);
            toast.error("Tap failed. Long press the input to paste.");
        }
    };

    // Shared paste processing logic for both button and native paste
    const processPastedText = (text: string) => {
        // Replace BGMI invisible characters (macron vowels) with spaces
        const sanitized = text
            .replace(/[ĀāĒēĪīŌōŪū]/g, " ")
            .replace(/\s+/g, " ")
            .trim();
        // Reject if longer than max chars (BGMI max IGN length)
        if (sanitized.length > MAX_IGN_LENGTH) {
            toast.error("Name too long! Please copy your actual IGN from BGMI.");
            return;
        }
        onChange(sanitized);
        // Validate min length and show error if too short
        if (sanitized.length < 2) {
            onErrorChange?.("Game Name must be at least 2 characters");
        } else {
            onErrorChange?.(""); // Clear error when valid
            toast.success("Game Name pasted!");
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

    // Handle native paste (long-press paste) for readOnly mode
    const handleNativePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();
        setTouched(true);
        const pastedText = e.clipboardData.getData("text");
        if (pastedText.trim()) {
            processPastedText(pastedText);
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

    // Block keyboard input but allow paste shortcuts
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        // Allow Ctrl+V / Cmd+V for paste
        if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
            return;
        }
        // Block all other input
        e.preventDefault();
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
                    // Onboarding style: tap to paste with external clear button
                    <div className="flex gap-2 items-center">
                        <div
                            onClick={!disabled && !value ? handlePaste : undefined}
                            className={`relative flex-1 min-h-[40px] rounded-md border bg-slate-50 dark:bg-slate-700/50 cursor-pointer active:scale-[0.99] transition-transform ${showError
                                ? "border-red-500 ring-1 ring-red-500"
                                : "border-slate-300 dark:border-slate-600 hover:border-indigo-400 dark:hover:border-indigo-500"
                                } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
                        >
                            {/* Visible text layer */}
                            <div
                                className={`px-3 py-2 ${!value ? "text-slate-400 dark:text-slate-500" : "text-slate-800 dark:text-slate-200"}`}
                                style={{
                                    WebkitUserSelect: 'none',
                                    userSelect: 'none'
                                }}
                            >
                                <span className="truncate block">{value || (clipboardDenied ? "Long press to paste" : "Tap to paste")}</span>
                            </div>

                            {/* ContentEditable layer (captures long-press paste) */}
                            <div
                                id="gameName"
                                contentEditable
                                suppressContentEditableWarning
                                inputMode="none"
                                onPaste={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setTouched(true);
                                    const pastedText = e.clipboardData.getData("text").trim();
                                    if (pastedText) {
                                        processPastedText(pastedText);
                                    }
                                    (e.target as HTMLElement).blur();
                                }}
                                onClick={(e) => {
                                    // Only trigger paste via click if not already has value
                                    if (!disabled && !value) {
                                        e.stopPropagation();
                                        handlePaste();
                                    }
                                }}
                                onKeyDown={(e) => e.preventDefault()}
                                onInput={(e) => {
                                    (e.target as HTMLElement).textContent = '';
                                }}
                                className="absolute inset-0 z-10 px-3 py-2 opacity-0"
                                style={{
                                    caretColor: 'transparent',
                                    WebkitUserSelect: 'text',
                                    userSelect: 'text'
                                }}
                            />
                        </div>

                        {/* Clear button - outside input, only visible when has value */}
                        {value && !disabled && (
                            <button
                                type="button"
                                onClick={handleClear}
                                className="p-2 rounded-md bg-red-500 hover:bg-red-600 text-white transition-colors shrink-0"
                                title="Clear"
                            >
                                <FiX className="w-5 h-5" />
                            </button>
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
