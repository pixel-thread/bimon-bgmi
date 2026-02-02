"use client";

import { motion } from "framer-motion";
import { Cake, Gift, Sparkles } from "lucide-react";
import { formatBirthday, getBirthdayStatus } from "@/src/utils/birthdayCheck";

/**
 * Birthday Banner - Shows publicly when a player chooses to share their birthday
 * Displayed in place of JobBoardBanner while poll is active
 */
export function BirthdayBanner({
    dateOfBirth,
    playerName,
}: {
    dateOfBirth: Date | string;
    playerName: string;
}) {
    const birthdayStatus = getBirthdayStatus(dateOfBirth);
    const formattedBirthday = formatBirthday(dateOfBirth);

    const getMessage = () => {
        switch (birthdayStatus) {
            case "today":
                return "🎂 It's my birthday today!";
            case "yesterday":
                return "🎂 My birthday was yesterday!";
            case "tomorrow":
                return "🎂 My birthday is tomorrow!";
            default:
                return "🎂 Birthday Season!";
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-4 mb-4"
        >
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 p-[2px]">
                <div className="rounded-[10px] bg-zinc-950/95 backdrop-blur-sm px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                        {/* Left: Icon and message */}
                        <div className="flex items-center gap-3">
                            <motion.div
                                animate={{
                                    scale: [1, 1.1, 1],
                                    rotate: [0, -5, 5, 0],
                                }}
                                transition={{
                                    duration: 2,
                                    repeat: Infinity,
                                    ease: "easeInOut",
                                }}
                                className="flex-shrink-0"
                            >
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center">
                                    <Cake className="w-5 h-5 text-white" />
                                </div>
                            </motion.div>

                            <div>
                                <p className="text-white font-semibold text-sm">
                                    {getMessage()}
                                </p>
                                <p className="text-zinc-400 text-xs">
                                    <span className="text-pink-400 font-medium">{playerName}</span>
                                    {formattedBirthday && ` • ${formattedBirthday}`}
                                </p>
                            </div>
                        </div>

                        {/* Right: Free entry badge */}
                        <motion.div
                            animate={{ scale: [1, 1.05, 1] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border border-yellow-500/30"
                        >
                            <Gift className="w-4 h-4 text-yellow-400" />
                            <span className="text-yellow-400 text-xs font-bold">Free Entry!</span>
                        </motion.div>
                    </div>

                    {/* Floating decorations */}
                    <motion.div
                        animate={{ y: [0, -5, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="absolute top-2 right-16 text-lg"
                    >
                        🎈
                    </motion.div>
                    <motion.div
                        animate={{ y: [0, -3, 0] }}
                        transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                        className="absolute top-3 right-8 text-sm"
                    >
                        ✨
                    </motion.div>
                </div>
            </div>
        </motion.div>
    );
}
