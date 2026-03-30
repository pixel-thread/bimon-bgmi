"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

interface ImagePreviewProps {
    src: string | null;
    alt?: string;
    isOpen: boolean;
    onClose: () => void;
}

export function ImagePreview({ src, alt = "", isOpen, onClose }: ImagePreviewProps) {
    // Close on escape
    useEffect(() => {
        if (!isOpen) return;
        const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [isOpen, onClose]);

    return (
        <AnimatePresence>
            {isOpen && src && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm"
                    onClick={onClose}
                >
                    {/* Close button */}
                    <button
                        onClick={onClose}
                        className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition-colors hover:bg-white/20 active:scale-95"
                    >
                        <X className="h-5 w-5" />
                    </button>

                    {/* Image */}
                    <motion.img
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        src={src}
                        alt={alt}
                        className="max-h-[80vh] max-w-[90vw] rounded-2xl object-contain shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    />
                </motion.div>
            )}
        </AnimatePresence>
    );
}
