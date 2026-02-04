"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import {
    Gamepad2,
    Download,
    Smartphone,
    Shield,
    Zap,
    Gift,
    Star,
    Bell,
    ChevronRight,
    ExternalLink,
    Monitor,
} from "lucide-react";
import Link from "next/link";
import { NATIVE_APP_CONFIG } from "@/src/lib/constant/app-config";

// Detect if user is on mobile device (actual device, not just screen width)
function useIsMobileDevice() {
    const [isMobileDevice, setIsMobileDevice] = useState<boolean | null>(null);
    const [isAndroid, setIsAndroid] = useState(false);
    const [isIOS, setIsIOS] = useState(false);

    useEffect(() => {
        const userAgent = navigator.userAgent.toLowerCase();
        const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
        const android = /android/i.test(userAgent);
        const ios = /iphone|ipad|ipod/i.test(userAgent);

        setIsMobileDevice(isMobile);
        setIsAndroid(android);
        setIsIOS(ios);
    }, []);

    return { isMobileDevice, isAndroid, isIOS };
}

const FEATURE_ICONS = [
    { icon: Gift, color: "text-amber-500", bg: "from-amber-500/20 to-orange-500/20" },
    { icon: Zap, color: "text-emerald-500", bg: "from-emerald-500/20 to-green-500/20" },
    { icon: Shield, color: "text-blue-500", bg: "from-blue-500/20 to-indigo-500/20" },
    { icon: Star, color: "text-purple-500", bg: "from-purple-500/20 to-pink-500/20" },
    { icon: Bell, color: "text-rose-500", bg: "from-rose-500/20 to-red-500/20" },
];

export default function GamesPage() {
    const { isMobileDevice, isAndroid, isIOS } = useIsMobileDevice();
    const [downloadStarted, setDownloadStarted] = useState(false);

    const handleDownload = () => {
        setDownloadStarted(true);

        // If Play Store is available, prefer that
        if (NATIVE_APP_CONFIG.playStoreUrl) {
            window.open(NATIVE_APP_CONFIG.playStoreUrl, "_blank");
        } else {
            // Direct APK download
            window.location.href = NATIVE_APP_CONFIG.apkDownloadUrl;
        }
    };

    // Show loading state while detecting device
    if (isMobileDevice === null) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="animate-pulse flex flex-col items-center gap-4">
                    <div className="p-4 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-2xl">
                        <Gamepad2 className="h-8 w-8 text-indigo-500" />
                    </div>
                    <p className="text-muted-foreground">Loading...</p>
                </div>
            </div>
        );
    }

    // Desktop users - redirect to web games
    if (!isMobileDevice) {
        return (
            <div className="max-w-2xl mx-auto space-y-8 py-8">
                {/* Header */}
                <div className="text-center space-y-4">
                    <div className="inline-flex p-4 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-2xl">
                        <Monitor className="h-10 w-10 text-indigo-500" />
                    </div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                        Games Available on Desktop
                    </h1>
                    <p className="text-muted-foreground max-w-md mx-auto">
                        You can play mini games directly in your browser! For mobile users, we recommend downloading our native app for the best experience.
                    </p>
                </div>

                {/* Play Now Card */}
                <Card className="border-indigo-500/20 bg-gradient-to-br from-indigo-500/5 to-purple-500/5">
                    <CardContent className="p-6 space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-xl">
                                <Gamepad2 className="h-6 w-6 text-indigo-500" />
                            </div>
                            <div>
                                <h2 className="font-bold text-lg">Game Arcade</h2>
                                <p className="text-sm text-muted-foreground">
                                    Play mini games while waiting for tournaments
                                </p>
                            </div>
                        </div>

                        <Link href="/tournament/games">
                            <Button className="w-full gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500">
                                <Gamepad2 className="h-4 w-4" />
                                Open Game Arcade
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Mobile users - show app download prompt
    return (
        <div className="max-w-md mx-auto space-y-6 py-6">
            {/* Hero Section */}
            <div className="text-center space-y-4">
                <div className="relative inline-block">
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-3xl blur-xl opacity-30 animate-pulse" />
                    <div className="relative p-5 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-3xl border border-indigo-500/20">
                        <Smartphone className="h-12 w-12 text-indigo-400" />
                    </div>
                </div>

                <div className="space-y-2">
                    <Badge variant="secondary" className="gap-1">
                        <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                        Better Experience on App
                    </Badge>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                        Get {NATIVE_APP_CONFIG.name}
                    </h1>
                    <p className="text-sm text-muted-foreground px-4">
                        Download our native app for the best gaming experience with rewarded ads and exclusive features!
                    </p>
                </div>
            </div>

            {/* Download Card */}
            <Card className="border-indigo-500/30 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 overflow-hidden">
                <div className="absolute inset-0 bg-[url('/images/pattern.svg')] opacity-5" />
                <CardContent className="relative p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl shadow-lg shadow-indigo-500/20">
                                <Gamepad2 className="h-7 w-7 text-white" />
                            </div>
                            <div>
                                <h2 className="font-bold text-lg">{NATIVE_APP_CONFIG.name}</h2>
                                <p className="text-xs text-muted-foreground">
                                    v{NATIVE_APP_CONFIG.version} • {NATIVE_APP_CONFIG.appSize}
                                </p>
                            </div>
                        </div>
                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                            FREE
                        </Badge>
                    </div>

                    {/* Download Button */}
                    <Button
                        onClick={handleDownload}
                        disabled={downloadStarted}
                        className="w-full h-12 gap-2 text-base font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-lg shadow-indigo-500/20 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                    >
                        {downloadStarted ? (
                            <>
                                <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Downloading...
                            </>
                        ) : (
                            <>
                                <Download className="h-5 w-5" />
                                {isAndroid ? "Download APK" : "Download App"}
                            </>
                        )}
                    </Button>

                    {/* Platform Info */}
                    {isAndroid && !NATIVE_APP_CONFIG.playStoreUrl && (
                        <p className="text-xs text-center text-muted-foreground">
                            APK download • Requires Android {NATIVE_APP_CONFIG.minAndroidVersion}+
                        </p>
                    )}

                    {isIOS && (
                        <p className="text-xs text-center text-amber-500">
                            iOS app coming soon! For now, add to home screen for best experience.
                        </p>
                    )}
                </CardContent>
            </Card>

            {/* Features List */}
            <Card>
                <CardContent className="p-5 space-y-4">
                    <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
                        Why use the app?
                    </h3>

                    <div className="space-y-3">
                        {NATIVE_APP_CONFIG.features.map((feature, index) => {
                            const { icon: Icon, color, bg } = FEATURE_ICONS[index % FEATURE_ICONS.length];
                            return (
                                <div
                                    key={feature}
                                    className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                                >
                                    <div className={`p-2 bg-gradient-to-br ${bg} rounded-lg`}>
                                        <Icon className={`h-4 w-4 ${color}`} />
                                    </div>
                                    <span className="text-sm font-medium">{feature}</span>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* Web Games Link */}
            <div className="text-center space-y-2">
                <p className="text-xs text-muted-foreground">
                    Want to play on web instead?
                </p>
                <Link href="/tournament/games">
                    <Button variant="ghost" className="gap-2 text-indigo-400 hover:text-indigo-300">
                        <Gamepad2 className="h-4 w-4" />
                        Open Web Games
                        <ExternalLink className="h-3 w-3" />
                    </Button>
                </Link>
            </div>

            {/* Trust Badges */}
            <div className="flex items-center justify-center gap-4 pt-2">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Shield className="h-3.5 w-3.5 text-emerald-500" />
                    <span>Safe & Secure</span>
                </div>
                <div className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Zap className="h-3.5 w-3.5 text-amber-500" />
                    <span>Fast Install</span>
                </div>
            </div>
        </div>
    );
}
