"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";

let interval: ReturnType<typeof setInterval>;

type Card = {
    id: number;
    imageUrl: string;
    matchNumber: number;
};

export const CardStack = ({
    items,
    offset,
    scaleFactor,
}: {
    items: Card[];
    offset?: number;
    scaleFactor?: number;
}) => {
    const CARD_OFFSET = offset || 10;
    const SCALE_FACTOR = scaleFactor || 0.06;
    const [cards, setCards] = useState<Card[]>(items);

    useEffect(() => {
        startFlipping();
        return () => clearInterval(interval);
    }, []);

    const startFlipping = () => {
        interval = setInterval(() => {
            setCards((prevCards: Card[]) => {
                const newArray = [...prevCards];
                // Move first card to end for proper 1→2→3 sequence
                newArray.push(newArray.shift()!);
                return newArray;
            });
        }, 4000); // Slower - 4 seconds between flips
    };

    return (
        <div className="relative h-24 w-full">
            {cards.map((card, index) => {
                // Reverse the visual stacking - last in array shows on top
                const reverseIndex = cards.length - 1 - index;
                return (
                    <motion.div
                        key={card.id}
                        className="absolute dark:bg-slate-800 bg-white h-24 w-full rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden"
                        style={{
                            transformOrigin: "top center",
                        }}
                        animate={{
                            top: reverseIndex * -CARD_OFFSET,
                            scale: 1 - reverseIndex * SCALE_FACTOR,
                            zIndex: index + 1,
                        }}
                        transition={{ duration: 0.5, ease: "easeInOut" }}
                    >
                        <Image
                            src={card.imageUrl}
                            alt={`Match ${card.matchNumber}`}
                            fill
                            className="object-cover"
                        />
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                            <span className="text-white text-sm font-medium">
                                Match {card.matchNumber}
                            </span>
                        </div>
                    </motion.div>
                );
            })}
        </div>
    );
};
