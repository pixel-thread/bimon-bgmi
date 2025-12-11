"use client";

import { buttonVariants } from "@/src/components/ui/button";
import { cn } from "@/src/lib/utils";
import Link from "next/link";
import { motion } from "framer-motion";

export default function NotFound() {
    return (
        <main className="min-h-screen flex flex-col justify-center items-center px-6 py-24 sm:py-32 lg:px-8 bg-slate-100 dark:bg-black relative overflow-hidden">
            {/* Subtle background elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute w-96 h-96 rounded-full bg-slate-200 dark:bg-white/5 blur-3xl" style={{ top: "20%", left: "10%" }} />
                <div className="absolute w-64 h-64 rounded-full bg-slate-200 dark:bg-white/5 blur-3xl" style={{ bottom: "20%", right: "15%" }} />
            </div>

            {/* Grid pattern overlay */}
            <div
                className="absolute inset-0 opacity-5"
                style={{
                    backgroundImage: `linear-gradient(currentColor 1px, transparent 1px),
                           linear-gradient(90deg, currentColor 1px, transparent 1px)`,
                    backgroundSize: "50px 50px",
                }}
            />

            <div className="text-center relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <p className="text-lg font-black text-slate-500 font-gaming tracking-widest mb-2">
                        ERROR CODE
                    </p>
                </motion.div>

                {/* Large 404 */}
                <motion.h1
                    className="text-[8rem] sm:text-[12rem] lg:text-[16rem] font-black tracking-tighter leading-none text-slate-900 dark:text-white font-military"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                >
                    404
                </motion.h1>

                {/* Mission Failed text */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                >
                    <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-wider text-slate-900 dark:text-white font-gaming mb-4">
                        PAGE NOT FOUND
                    </h2>
                    <p className="text-base sm:text-lg font-medium text-slate-600 dark:text-slate-400 max-w-md mx-auto mb-2">
                        The page you're looking for doesn't exist.
                    </p>
                    <p className="text-sm text-slate-500">
                        It may have been moved, deleted, or never existed.
                    </p>
                </motion.div>

                {/* Status indicator */}
                <motion.div
                    className="mt-8 flex items-center justify-center gap-3"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.5 }}
                >
                    <div className="flex items-center gap-2 bg-slate-200 dark:bg-slate-800 px-4 py-2 rounded-full border border-slate-300 dark:border-slate-700">
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                        <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                            Page Not Found
                        </span>
                    </div>
                </motion.div>

                {/* Action buttons */}
                <motion.div
                    className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.6 }}
                >
                    <Link
                        href="/"
                        className={cn(
                            buttonVariants({ variant: "default", size: "lg" }),
                            "min-w-[180px] bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-black font-bold transition-all duration-300"
                        )}
                    >
                        <svg
                            className="w-5 h-5 mr-2"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                            />
                        </svg>
                        Go to Home
                    </Link>

                    <Link
                        href="/tournament"
                        className={cn(
                            buttonVariants({ variant: "outline", size: "lg" }),
                            "min-w-[180px] font-semibold border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-all duration-300"
                        )}
                    >
                        <svg
                            className="w-5 h-5 mr-2"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                            />
                        </svg>
                        View Tournament
                    </Link>
                </motion.div>

                {/* Helpful links */}
                <motion.div
                    className="mt-12"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.8 }}
                >
                    <p className="text-sm text-slate-600 mb-4">
                        Quick navigation:
                    </p>
                    <div className="flex flex-wrap justify-center gap-3 text-sm">
                        <Link
                            href="/about"
                            className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors underline-offset-4 hover:underline"
                        >
                            About
                        </Link>
                        <span className="text-slate-400 dark:text-slate-700">•</span>
                        <Link
                            href="/guides"
                            className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors underline-offset-4 hover:underline"
                        >
                            Guides
                        </Link>
                        <span className="text-slate-400 dark:text-slate-700">•</span>
                        <Link
                            href="/faq"
                            className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors underline-offset-4 hover:underline"
                        >
                            FAQ
                        </Link>
                        <span className="text-slate-400 dark:text-slate-700">•</span>
                        <Link
                            href="/contact"
                            className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors underline-offset-4 hover:underline"
                        >
                            Contact
                        </Link>
                    </div>
                </motion.div>
            </div>
        </main>
    );
}
