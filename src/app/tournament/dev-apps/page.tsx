"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    FiExternalLink,
    FiSmartphone,
    FiGlobe,
    FiCode,
    FiLayers,
    FiDatabase,
    FiServer,
    FiMonitor,
    FiZap,
    FiAward,
} from "react-icons/fi";
import Link from "next/link";
import Image from "next/image";

type AppType = "web" | "mobile" | "both";

interface DevApp {
    id: string;
    name: string;
    tagline: string;
    description: string;
    type: AppType;
    techStack: string[];
    features: string[];
    url?: string;
    playStoreUrl?: string;
    gradient: string;
    iconUrl?: string;
    emoji: string;
    status: "live" | "beta" | "development";
}

// ─── ADD YOUR APPS HERE ───────────────────────────────────────
const apps: DevApp[] = [
    {
        id: "bimon-bgmi",
        name: "PUBGMI BIMON",
        tagline: "Competitive BGMI Tournament Platform",
        description:
            "A full-featured tournament management platform for BGMI players. Handles team generation, voting, stats tracking, UC economy, prize distribution, AI-powered score parsing, and more.",
        type: "both",
        techStack: [
            "Next.js",
            "TypeScript",
            "Prisma",
            "PostgreSQL",
            "Tailwind CSS",
            "Clerk Auth",
            "React Native",
        ],
        features: [
            "Tournament management with auto team balancing",
            "Real-time voting & polls",
            "Player stats & K/D tracking",
            "UC virtual currency economy",
            "AI scoreboard parser",
            "Royal Pass subscription system",
            "Analytics dashboard",
            "Mobile app (React Native)",
        ],
        url: "https://bimon-bgmi.vercel.app",
        gradient: "from-indigo-500 via-purple-500 to-pink-500",
        iconUrl: "/android-chrome-192x192.png",
        emoji: "🎮",
        status: "live",
    },
    {
        id: "riban",
        name: "Riban",
        tagline: "Watch Movies Together, Apart",
        description:
            "A movie sync app for couples in long-distance relationships. Synchronizes video playback across devices so you can watch together in real-time, no matter the distance.",
        type: "mobile",
        techStack: [
            "React Native",
            "Expo",
            "WebSocket",
            "Node.js",
        ],
        features: [
            "Real-time video sync across devices",
            "Room-based watching sessions",
            "Gesture controls (brightness & volume)",
            "Multiple resize modes",
            "Buffering indicator",
            "Fast-forward on long press",
        ],
        gradient: "from-rose-500 via-red-500 to-orange-500",
        iconUrl: "/images/riban-app-icon.png",
        emoji: "🎬",
        status: "live",
        url: "https://expo.dev/accounts/123bimon/projects/riban/builds/bd0df939-1e8c-4290-a458-9139ff74c990",
    },
    {
        id: "pubgmi-games",
        name: "PUBGMI Games",
        tagline: "Mini Games & Rewards for BGMI Players",
        description:
            "A native Android app featuring mini games like Memory Match where players can earn UC by watching rewarded ads. Built as a companion to the PUBGMI tournament platform.",
        type: "mobile",
        techStack: [
            "React Native",
            "Expo",
        ],
        features: [
            "Play games with rewarded ads",
            "Earn UC by watching ads",
            "Faster native performance",
            "Offline mode for some games",
            "Push notifications for tournaments",
        ],
        gradient: "from-violet-500 via-indigo-500 to-blue-500",
        iconUrl: "/images/bimon-app-icon.png",
        emoji: "🕹️",
        status: "live",
        url: "/games",
    },
    {
        id: "kynshi-drops",
        name: "Kynshi Drops",
        tagline: "Pure Mountain Spring Water from Meghalaya",
        description:
            "A business website for a spring water brand sourced from the West Khasi Hills of Meghalaya. Features product catalog, WhatsApp ordering, and a dealership application system.",
        type: "web",
        techStack: [
            "Next.js",
            "TypeScript",
            "Tailwind CSS",
        ],
        features: [
            "Product catalog with multiple sizes",
            "WhatsApp ordering integration",
            "Dealership application system",
            "Responsive mobile-first design",
            "SEO optimized landing page",
        ],
        gradient: "from-cyan-500 via-teal-500 to-emerald-500",
        emoji: "💧",
        status: "live",
        url: "https://kynshi-drops.vercel.app",
    },
    {
        id: "invento",
        name: "Invento",
        tagline: "Mobile-First Inventory Management for Repair Shops",
        description:
            "A progressive web app (PWA) that helps repair shop owners manage inventory across multiple stores. Features multi-store support with staff access controls, real-time product tracking with category/brand organization, low-stock alerts, and a sleek dark-mode UI optimized for mobile devices.",
        type: "web",
        techStack: [
            "Next.js",
            "TypeScript",
            "Tailwind CSS",
            "Drizzle ORM",
            "Turso",
            "Clerk Auth",
            "Framer Motion",
            "PWA",
        ],
        features: [
            "Multi-store inventory management with org-based isolation",
            "Staff accounts with join-code access (no email required)",
            "Real-time product search with category & brand filtering",
            "Low-stock alerts and total store value dashboard",
            "Add, edit, and adjust stock with mobile-optimized drawers",
            "Category & brand management settings panel",
            "Installable PWA with offline-ready service worker",
            "Dark/light theme support with smooth animations",
        ],
        gradient: "from-amber-500 via-orange-500 to-red-500",
        iconUrl: "/images/invento-app-icon.png",
        emoji: "📦",
        status: "development",
        url: "https://invento-azure.vercel.app",
    },
    {
        id: "streak-timer",
        name: "Streak Timer",
        tagline: "Track Your Streaks with Precision — Every Second Counts",
        description:
            "A minimalist habit-tracking app that counts elapsed time from a starting point with calendar-aware precision (years, months, days, hours, minutes, seconds). Features a beautifully dark UI with smooth animations and an Android home screen widget that keeps your streak visible at a glance.",
        type: "mobile",
        techStack: [
            "React Native",
            "Expo",
            "TypeScript",
            "AsyncStorage",
            "Kotlin",
            "Android Widgets",
        ],
        features: [
            "Real-time streak tracking with calendar-aware time breakdown",
            "Native Android home screen widget showing live streak duration",
            "Persistent timer state that survives app restarts",
            "Elegant dark-themed UI with smooth pulse and rotation animations",
            "One-tap start/reset with confirmation modal",
            "Adaptive time display that scales tiers based on streak length",
            "Inter font family for clean, modern typography",
            "Edge-to-edge Android support with safe area handling",
        ],
        gradient: "from-emerald-500 via-teal-500 to-cyan-500",
        emoji: "⏱️",
        status: "development",
        url: "https://expo.dev/accounts/123bimon/projects/streak-timer/builds/25cbb717-2b58-4ec3-976b-e7c861a44c5a",
    },
    {
        id: "apus-tracker",
        name: "Apus Tracker",
        tagline: "Never Miss an AI Model's Availability Window Again",
        description:
            "A mobile app for managing usage lockout periods across multiple AI accounts and models like Claude, Gemini, and ChatGPT. Features a smart time parser that extracts lockout durations from pasted messages, live countdown timers, and an Android home screen widget for at-a-glance availability.",
        type: "mobile",
        techStack: [
            "React Native",
            "Expo",
            "TypeScript",
            "Zustand",
            "AsyncStorage",
            "date-fns",
        ],
        features: [
            "Multi-account management for tracking multiple AI service accounts",
            "Multi-model tracking with support for Claude, Gemini, ChatGPT, and more",
            "Smart time parser that auto-extracts lockout dates from pasted messages",
            "Live countdown timers with real-time availability updates",
            "Android home screen widget with top 3 available models",
            "Premium OLED dark theme with glassmorphism card design",
            "Priority sorting — ready models first, waiting sorted by soonest",
            "Tab-based dashboard with Overview, Accounts, and Upcoming views",
        ],
        gradient: "from-fuchsia-500 via-purple-600 to-indigo-600",
        emoji: "🤖",
        status: "development",
        url: "https://expo.dev/accounts/bimon/projects/apus-tracker/builds/a4fea1eb-6532-4812-8192-5ac319f8fc52",
    },
    {
        id: "noveljones",
        name: "Noveljones Portfolio",
        tagline: "Photography Portfolio for a Shillong Wedding Photographer",
        description:
            "A sleek photography portfolio website for Noveljones Syiemlieh, a Shillong-based photographer. Showcases wedding, portrait, and product photography with a modern gallery layout, service cards, and a contact section.",
        type: "web",
        techStack: [
            "HTML",
            "CSS",
            "JavaScript",
        ],
        features: [
            "Responsive photography gallery with hover effects",
            "Service cards for Wedding, Portrait & Videography",
            "Category-based photo filtering",
            "Contact form for work inquiries",
            "Smooth scroll animations",
            "Mobile-optimized layout",
        ],
        gradient: "from-stone-500 via-zinc-600 to-neutral-800",
        emoji: "📸",
        status: "live",
        url: "https://noveljones.netlify.app",
    },
];
// ──────────────────────────────────────────────────────────────

const typeIcons: Record<AppType, React.ReactNode> = {
    web: <FiGlobe className="h-4 w-4" />,
    mobile: <FiSmartphone className="h-4 w-4" />,
    both: <FiLayers className="h-4 w-4" />,
};

const typeLabels: Record<AppType, string> = {
    web: "Web App",
    mobile: "Mobile App",
    both: "Web + Mobile",
};

const statusColors: Record<string, string> = {
    live: "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
    beta: "bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30",
    development: "bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30",
};

const techColors: Record<string, string> = {
    "Next.js": "bg-black dark:bg-white text-white dark:text-black",
    "TypeScript": "bg-blue-600 text-white",
    "React Native": "bg-cyan-500 text-white",
    "Prisma": "bg-teal-600 text-white",
    "PostgreSQL": "bg-blue-800 text-white",
    "Tailwind CSS": "bg-sky-500 text-white",
    "Clerk Auth": "bg-violet-600 text-white",
    "Expo": "bg-gray-800 text-white",
    "WebSocket": "bg-green-600 text-white",
    "Node.js": "bg-green-700 text-white",
    "Drizzle ORM": "bg-lime-600 text-white",
    "Turso": "bg-teal-500 text-white",
    "Framer Motion": "bg-pink-600 text-white",
    "PWA": "bg-indigo-600 text-white",
    "Kotlin": "bg-purple-700 text-white",
    "AsyncStorage": "bg-orange-600 text-white",
    "Android Widgets": "bg-green-800 text-white",
    "Zustand": "bg-amber-700 text-white",
    "date-fns": "bg-rose-600 text-white",
    "HTML": "bg-orange-500 text-white",
    "CSS": "bg-blue-500 text-white",
    "JavaScript": "bg-yellow-500 text-black",
};

export default function DevAppsPage() {
    const [expandedApp, setExpandedApp] = useState<string | null>(null);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-zinc-950 dark:via-black dark:to-zinc-950">
            <div className="container mx-auto px-4 py-12 md:py-20 max-w-5xl">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="text-center mb-16"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 text-sm font-medium mb-6">
                        <FiCode className="h-4 w-4" />
                        Developer Portfolio
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4 tracking-tight">
                        Apps & Projects
                    </h1>
                    <p className="text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
                        A showcase of the websites and mobile apps I&apos;ve built — from gaming platforms to utility apps.
                    </p>

                    {/* Stats row */}
                    <div className="flex items-center justify-center gap-8 mt-8">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-slate-900 dark:text-white">
                                {apps.length}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-0.5">
                                Projects
                            </div>
                        </div>
                        <div className="h-8 w-px bg-slate-200 dark:bg-zinc-800" />
                        <div className="text-center">
                            <div className="text-2xl font-bold text-slate-900 dark:text-white">
                                {new Set(apps.flatMap((a) => a.techStack)).size}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-0.5">
                                Technologies
                            </div>
                        </div>
                        <div className="h-8 w-px bg-slate-200 dark:bg-zinc-800" />
                        <div className="text-center">
                            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                                {apps.filter((a) => a.status === "live").length}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-0.5">
                                Live
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* App Cards */}
                <div className="space-y-6">
                    {apps.map((app, index) => {
                        const isExpanded = expandedApp === app.id;
                        return (
                            <motion.div
                                key={app.id}
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                            >
                                <div
                                    className={`relative bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 overflow-hidden transition-all duration-300 ${isExpanded
                                        ? "shadow-xl shadow-indigo-500/5 dark:shadow-indigo-500/10 ring-1 ring-indigo-500/20"
                                        : "shadow-sm hover:shadow-lg hover:shadow-slate-200/50 dark:hover:shadow-black/30"
                                        }`}
                                >
                                    {/* Gradient top bar */}
                                    <div
                                        className={`h-1 bg-gradient-to-r ${app.gradient}`}
                                    />

                                    {/* Main content */}
                                    <div className="p-6 md:p-8">
                                        <div className="flex items-start gap-4 md:gap-6">
                                            {/* Icon */}
                                            <div
                                                className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl overflow-hidden ${app.iconUrl ? "" : `bg-gradient-to-br ${app.gradient} flex items-center justify-center text-2xl md:text-3xl`} shadow-lg flex-shrink-0`}
                                            >
                                                {app.iconUrl ? (
                                                    <Image
                                                        src={app.iconUrl}
                                                        alt={app.name}
                                                        width={64}
                                                        height={64}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    app.emoji
                                                )}
                                            </div>

                                            {/* Info */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex flex-wrap items-center gap-2 mb-1">
                                                    <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">
                                                        {app.name}
                                                    </h2>
                                                    {/* Status badge */}
                                                    <span
                                                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${statusColors[app.status]}`}
                                                    >
                                                        <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 animate-pulse" />
                                                        {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                                                    </span>
                                                    {/* Type badge */}
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-slate-400">
                                                        {typeIcons[app.type]}
                                                        {typeLabels[app.type]}
                                                    </span>
                                                </div>

                                                <p className="text-slate-500 dark:text-slate-400 text-sm md:text-base mb-4">
                                                    {app.tagline}
                                                </p>

                                                {/* Tech stack chips */}
                                                <div className="flex flex-wrap gap-1.5 mb-4">
                                                    {app.techStack.map((tech) => (
                                                        <span
                                                            key={tech}
                                                            className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold tracking-wide ${techColors[tech] ||
                                                                "bg-slate-200 dark:bg-zinc-700 text-slate-700 dark:text-slate-300"
                                                                }`}
                                                        >
                                                            {tech}
                                                        </span>
                                                    ))}
                                                </div>

                                                {/* Action buttons */}
                                                <div className="flex flex-wrap items-center gap-3">
                                                    <button
                                                        onClick={() =>
                                                            setExpandedApp(isExpanded ? null : app.id)
                                                        }
                                                        className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
                                                    >
                                                        {isExpanded ? "Show less" : "Learn more →"}
                                                    </button>

                                                    {app.url && (
                                                        <a
                                                            href={app.url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-slate-900 dark:bg-white text-white dark:text-black hover:bg-slate-700 dark:hover:bg-slate-200 transition-colors"
                                                        >
                                                            <FiExternalLink className="h-3.5 w-3.5" />
                                                            {app.type === "mobile" ? "Download" : "Visit"}
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Expanded content */}
                                        <AnimatePresence>
                                            {isExpanded && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: "auto", opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    transition={{ duration: 0.3, ease: "easeInOut" }}
                                                    className="overflow-hidden"
                                                >
                                                    <div className="mt-6 pt-6 border-t border-slate-100 dark:border-zinc-800">
                                                        {/* Description */}
                                                        <p className="text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
                                                            {app.description}
                                                        </p>

                                                        {/* Features grid */}
                                                        <div>
                                                            <h3 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                                                                <FiZap className="h-4 w-4 text-amber-500" />
                                                                Key Features
                                                            </h3>
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                                {app.features.map((feature, i) => (
                                                                    <div
                                                                        key={i}
                                                                        className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400"
                                                                    >
                                                                        <span className="text-indigo-500 mt-0.5 flex-shrink-0">
                                                                            ▸
                                                                        </span>
                                                                        {feature}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Call to Action */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.5 }}
                    className="mt-16"
                >
                    <div className="relative bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl p-8 md:p-10 text-center overflow-hidden">
                        {/* Background pattern */}
                        <div className="absolute inset-0 opacity-10">
                            <div className="absolute inset-0" style={{ backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)", backgroundSize: "24px 24px" }} />
                        </div>

                        <div className="relative">
                            <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
                                Need an App or Website Built?
                            </h2>
                            <p className="text-white/80 mb-8 max-w-lg mx-auto">
                                Got an idea? Let&apos;s turn it into reality. Reach out and let&apos;s discuss your project.
                            </p>

                            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                                {/* WhatsApp Button */}
                                <a
                                    href="https://wa.me/918837011018?text=Hi%2C%20I%27m%20interested%20in%20getting%20an%20app%20or%20website%20built."
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2.5 px-6 py-3 rounded-xl bg-white text-slate-900 font-semibold text-sm hover:bg-slate-100 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg"
                                >
                                    <svg className="h-5 w-5 text-green-500" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                    </svg>
                                    WhatsApp Me
                                </a>

                                {/* Call Button */}
                                <a
                                    href="tel:+918837011018"
                                    className="inline-flex items-center gap-2.5 px-6 py-3 rounded-xl bg-white/15 text-white font-semibold text-sm hover:bg-white/25 transition-all hover:scale-[1.02] active:scale-[0.98] backdrop-blur-sm border border-white/20"
                                >
                                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                                    </svg>
                                    Call Now
                                </a>
                            </div>

                            <p className="text-white/50 text-xs mt-4">
                                +91 88370 11018
                            </p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
