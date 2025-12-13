"use client";

import { MemoryGame } from "@/src/components/games/memorygame/MemoryGame";
import { Button } from "@/src/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { FooterAd } from "@/src/components/ads";

export default function MemoryGamePage() {
    return (
        <div className="space-y-6">
            {/* Back Button */}
            <Button variant="ghost" size="sm" asChild className="gap-2 -ml-2">
                <Link href="/tournament/games">
                    <ArrowLeft className="h-4 w-4" />
                    Back to Games
                </Link>
            </Button>

            {/* Game Area */}
            <MemoryGame />

            {/* Ad Placement - Footer */}
            <FooterAd />
        </div>
    );
}
