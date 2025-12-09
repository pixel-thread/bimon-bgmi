"use client";

import { useState } from "react";
import { Button } from "@/src/components/ui/button";
import { Share2, Check, Copy } from "lucide-react";
import { toast } from "sonner";

interface ShareScoreButtonProps {
    score: number;
    time: string;
    moves: number;
    className?: string;
}

export function ShareScoreButton({ score, time, moves, className }: ShareScoreButtonProps) {
    const [copied, setCopied] = useState(false);

    const shareText = `🧠 Memory Match Score: ${score} points!\n⏱️ Time: ${time}\n🎯 Moves: ${moves}\n\nCan you beat my score? Play now!`;

    const handleShare = async () => {
        // Try native share first (mobile)
        if (navigator.share) {
            try {
                await navigator.share({
                    title: "Memory Match Score",
                    text: shareText,
                });
                return;
            } catch (error) {
                // User cancelled or share failed, fall back to copy
                if ((error as Error).name === "AbortError") return;
            }
        }

        // Fallback to clipboard copy
        try {
            await navigator.clipboard.writeText(shareText);
            setCopied(true);
            toast.success("Copied to clipboard!", {
                description: "Share your score with friends!",
            });
            setTimeout(() => setCopied(false), 2000);
        } catch {
            toast.error("Couldn't copy to clipboard");
        }
    };

    return (
        <Button
            variant="outline"
            size="sm"
            onClick={handleShare}
            className={`gap-2 ${className}`}
            aria-label="Share your score"
        >
            {copied ? (
                <>
                    <Check className="h-4 w-4 text-emerald-500" />
                    Copied!
                </>
            ) : (
                <>
                    <Share2 className="h-4 w-4" />
                    Share
                </>
            )}
        </Button>
    );
}
