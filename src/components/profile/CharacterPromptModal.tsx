"use client";

import { useState, useCallback } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import { generateRandomPrompt } from "@/src/data/ai-prompt-styles";
import { toast } from "sonner";
import { Copy, RefreshCw, Sparkles, Wand2, ImageIcon, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface CharacterPromptModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function CharacterPromptModal({
    open,
    onOpenChange,
}: CharacterPromptModalProps) {
    const [promptData, setPromptData] = useState(() => generateRandomPrompt());
    const [isCopied, setIsCopied] = useState(false);

    const generateNew = useCallback(() => {
        setPromptData(generateRandomPrompt());
        setIsCopied(false);
    }, []);

    const copyToClipboard = useCallback(async () => {
        try {
            await navigator.clipboard.writeText(promptData.prompt);
            setIsCopied(true);
            toast.success("Prompt copied!");
            setTimeout(() => setIsCopied(false), 2000);
        } catch (err) {
            toast.error("Failed to copy prompt");
        }
    }, [promptData.prompt]);

    // Regenerate when modal opens
    const handleOpenChange = (newOpen: boolean) => {
        if (newOpen) {
            generateNew();
        }
        onOpenChange(newOpen);
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="max-w-md sm:max-w-lg p-0 overflow-hidden bg-gradient-to-b from-white via-white to-purple-50/50 dark:from-zinc-900 dark:via-zinc-900 dark:to-purple-950/30">
                {/* Header with gradient */}
                <div className="px-6 pt-6 pb-4 bg-gradient-to-br from-purple-500/10 via-pink-500/5 to-transparent">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2.5 text-lg">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/25">
                                <Wand2 className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent font-bold">
                                    AI Character Art
                                </span>
                                <p className="text-xs font-normal text-muted-foreground mt-0.5">
                                    Generate unique prompts for your BGMI character
                                </p>
                            </div>
                        </DialogTitle>
                    </DialogHeader>
                </div>

                <div className="px-6 pb-6 space-y-4">


                    {/* Style Badge */}
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={promptData.styleName}
                            initial={{ opacity: 0, scale: 0.9, y: -5 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 5 }}
                            className="flex items-center gap-2"
                        >
                            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-purple-500/15 to-pink-500/15 border border-purple-500/25">
                                <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                                <span className="text-sm font-semibold text-purple-600 dark:text-purple-400">
                                    {promptData.styleName}
                                </span>
                            </div>
                        </motion.div>
                    </AnimatePresence>

                    {/* Prompt Display */}
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={promptData.styleName}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="relative group"
                        >
                            <div className="p-4 rounded-xl bg-white dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 shadow-sm max-h-[4.5rem] overflow-y-auto">
                                <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
                                    {promptData.prompt}
                                </p>
                            </div>
                        </motion.div>
                    </AnimatePresence>

                    {/* Instructions */}
                    <div className="flex items-start gap-2.5 p-3 rounded-lg bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20">
                        <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
                            Copy this prompt and paste it into <strong>ChatGPT</strong>, <strong>Gemini</strong>,
                            Include a screenshot of your BGMI character!
                        </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-1">
                        <Button
                            onClick={generateNew}
                            variant="outline"
                            className="flex-1 gap-2 h-11 border-2 hover:border-purple-300 dark:hover:border-purple-700 hover:bg-purple-50 dark:hover:bg-purple-500/10 transition-colors"
                        >
                            <RefreshCw className="w-4 h-4" />
                            New Style
                        </Button>
                        <Button
                            onClick={copyToClipboard}
                            className={`flex-1 gap-2 h-11 font-semibold transition-all ${isCopied
                                ? "bg-green-500 hover:bg-green-600 shadow-lg shadow-green-500/25"
                                : "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-lg shadow-purple-500/25"
                                }`}
                        >
                            <Copy className="w-4 h-4" />
                            {isCopied ? "Copied!" : "Copy Prompt"}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

