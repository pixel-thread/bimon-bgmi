"use client";
import { FiX, FiCheck } from "react-icons/fi";
import { useState, useMemo } from "react";
import html2canvas from "html2canvas-pro";
import { Button } from "@/src/components/ui/button";
import { TeamT } from "@/src/types/team";
import { LoaderFive } from "../../ui/loader";
import { Copy, Gamepad2 } from "lucide-react";
import { getDisplayName } from "@/src/utils/displayName";
import { useSeasonStore } from "@/src/store/season";
import { useGetSeasons } from "@/src/hooks/season/useGetSeasons";
import { useAppContext } from "@/src/hooks/context/useAppContext";

interface TeamsListModalProps {
    visible: boolean;
    onClose: () => void;
    backgroundImage?: string;
    tournamentTitle: string;
    teams: TeamT[];
    isLoading?: boolean;
}

export default function TeamsListModal({
    visible,
    onClose,
    backgroundImage = "/images/image.webp",
    tournamentTitle,
    teams,
    isLoading,
}: TeamsListModalProps) {
    const [isSharing, setIsSharing] = useState(false);
    const [shareSuccess, setShareSuccess] = useState(false);

    // Get season name from store and seasons data
    const { seasonId } = useSeasonStore();
    const { data: seasons } = useGetSeasons();
    const { activeSeason } = useAppContext();

    // Use seasonId from store, or fall back to activeSeason
    const effectiveSeasonId = seasonId || activeSeason?.id;
    const seasonName = effectiveSeasonId
        ? (seasons?.find((s: any) => s.id === effectiveSeasonId)?.name || activeSeason?.name || "")
        : "";

    // Deduplicate teams based on player composition
    const uniqueTeams = useMemo(() => {
        const seenTeams = new Set<string>();
        return (teams || []).filter((team) => {
            const playerKey = (team.players?.map((p) => p.name).sort().join(",")) || team.id;
            if (seenTeams.has(playerKey)) {
                return false;
            }
            seenTeams.add(playerKey);
            return true;
        });
    }, [teams]);

    // Calculate total players
    const totalPlayers = useMemo(() => {
        return uniqueTeams.reduce((sum, team) => sum + (team.players?.length || 0), 0);
    }, [uniqueTeams]);

    // Find the maximum number of players in any team
    const maxPlayers = useMemo(() => {
        return Math.max(...uniqueTeams.map((team) => team.players?.length || 0), 1);
    }, [uniqueTeams]);

    // Fallback for devices without clipboard support
    const downloadFallback = (canvas: HTMLCanvasElement) => {
        const downloadLink = document.createElement("a");
        downloadLink.download = `${tournamentTitle.replace(/\s+/g, "-")}-teams.png`;
        downloadLink.href = canvas.toDataURL("image/png");
        downloadLink.click();
        setShareSuccess(true);
        setTimeout(() => setShareSuccess(false), 2000);
    };

    const copyToClipboard = async () => {
        setIsSharing(true);
        setShareSuccess(false);

        const element = document.getElementById("teams-list-content") as HTMLDivElement | null;
        if (!element) {
            setIsSharing(false);
            return;
        }

        // Dynamically load screenshot.css
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "/screenshot.css";
        document.head.appendChild(link);

        const tempContainer = document.createElement("div");
        tempContainer.classList.add("screenshot-container");
        tempContainer.style.cssText = `
      position: absolute;
      width: 900px;
      left: -9999px;
      top: 0;
      overflow: hidden;
      background-image: url(${backgroundImage});
      background-size: cover;
      background-position: center;
      background-repeat: no-repeat;
    `;
        document.body.appendChild(tempContainer);

        const originalParent = element.parentNode;
        if (originalParent) originalParent.removeChild(element);
        tempContainer.appendChild(element);

        await new Promise((resolve) => setTimeout(resolve, 500));

        try {
            const canvas = await html2canvas(element, {
                backgroundColor: null,
                scale: 2,
                useCORS: true,
                scrollX: 0,
                scrollY: 0,
                ignoreElements: (el) => el.classList.contains("floating-button-group"),
            });

            const blob = await new Promise<Blob | null>((resolve) =>
                canvas.toBlob(resolve, "image/png")
            );

            if (!blob) {
                console.error("Failed to create blob");
                return;
            }

            // Create a file for sharing
            const file = new File([blob], `${tournamentTitle.replace(/\s+/g, "-")}-teams.png`, { type: "image/png" });

            // First, always try to copy to clipboard as a backup
            let copiedToClipboard = false;
            if (navigator.clipboard && window.ClipboardItem) {
                try {
                    await navigator.clipboard.write([
                        new window.ClipboardItem({ "image/png": blob }),
                    ]);
                    copiedToClipboard = true;
                } catch (e) {
                    console.warn("Clipboard copy failed:", e);
                }
            }

            // Then try Web Share API (opens share sheet on mobile)
            if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
                try {
                    await navigator.share({
                        files: [file],
                        title: tournamentTitle,
                    });
                    setShareSuccess(true);
                    setTimeout(() => setShareSuccess(false), 2000);
                } catch (e: any) {
                    // User cancelled share - but that's OK, we already copied to clipboard
                    if (e.name === 'AbortError') {
                        // User cancelled, but image is already copied
                        if (copiedToClipboard) {
                            setShareSuccess(true);
                            setTimeout(() => setShareSuccess(false), 2000);
                        }
                    } else {
                        console.warn("Share failed:", e);
                        // Show success if we at least copied to clipboard
                        if (copiedToClipboard) {
                            setShareSuccess(true);
                            setTimeout(() => setShareSuccess(false), 2000);
                        } else {
                            downloadFallback(canvas);
                        }
                    }
                }
            } else if (copiedToClipboard) {
                // No share API, but we copied to clipboard
                setShareSuccess(true);
                setTimeout(() => setShareSuccess(false), 2000);
            } else {
                // Neither share nor clipboard worked, download as fallback
                downloadFallback(canvas);
            }
        } catch (error) {
            console.error("Screenshot error:", error);
        } finally {
            if (originalParent) {
                tempContainer.removeChild(element);
                originalParent.appendChild(element);
            }
            document.body.removeChild(tempContainer);
            document.head.removeChild(link);
            setIsSharing(false);
        }
    };

    if (!visible) return null;

    return (
        <>
            <style jsx>{`
        @keyframes pulse-glow {
          0%, 100% {
            box-shadow: 0 0 10px rgba(249, 115, 22, 0.4), 0 0 20px rgba(249, 115, 22, 0.2);
          }
          50% {
            box-shadow: 0 0 15px rgba(249, 115, 22, 0.6), 0 0 30px rgba(249, 115, 22, 0.3);
          }
        }
        
        .share-button-glow {
          animation: pulse-glow 2s ease-in-out infinite;
        }
        
        .share-button-glow:hover {
          animation: none;
          box-shadow: 0 0 20px rgba(249, 115, 22, 0.6), 0 0 40px rgba(249, 115, 22, 0.3);
        }
      `}</style>

            <div className="fixed inset-0 flex items-center justify-center z-50">
                {/* Floating Control Buttons */}
                <div className="floating-button-group absolute top-4 right-4 z-30 flex gap-2">
                    <Button
                        onClick={copyToClipboard}
                        disabled={isSharing}
                        variant="ghost"
                        className={`
              relative overflow-hidden
              text-white hover:text-orange-400
              bg-black/60 hover:bg-black/80
              backdrop-blur-md
              border border-white/20 hover:border-orange-500/50
              p-2.5 rounded-xl
              transition-all duration-300
              ${!isSharing && !shareSuccess ? 'share-button-glow' : ''}
              ${shareSuccess ? 'bg-green-500/20 border-green-500/50' : ''}
            `}
                    >
                        {isSharing ? (
                            <div className="h-5 w-5 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
                        ) : shareSuccess ? (
                            <FiCheck className="h-5 w-5 text-green-400" />
                        ) : (
                            <Copy className="h-5 w-5" />
                        )}
                    </Button>

                    <Button
                        onClick={onClose}
                        variant="ghost"
                        className="
              text-white hover:text-red-400
              bg-black/60 hover:bg-black/80
              backdrop-blur-md
              border border-white/20 hover:border-red-500/50
              p-2.5 rounded-xl
              transition-all duration-300
            "
                    >
                        <FiX className="h-6 w-6" />
                    </Button>
                </div>

                {/* Main Content */}
                <div
                    id="teams-list-content"
                    className="relative w-full min-h-screen flex items-start justify-center bg-cover bg-center pt-6"
                    style={{ backgroundImage: `url(${backgroundImage})` }}
                >
                    {/* Premium gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/70" />

                    <div className="relative z-10 w-full max-w-4xl mx-auto p-4 sm:p-6">
                        {/* Title */}
                        <div className="text-center mb-6">
                            <h1
                                className="text-2xl sm:text-4xl font-bold font-montserrat tracking-wide text-orange-500"
                                style={{
                                    textShadow: '0 0 30px rgba(249, 115, 22, 0.6), 0 0 60px rgba(249, 115, 22, 0.3), 0 2px 4px rgba(0,0,0,0.5)'
                                }}
                            >
                                {tournamentTitle}
                            </h1>
                            {seasonName && (
                                <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30">
                                    <Gamepad2 className="h-3.5 w-3.5 text-blue-400" />
                                    <span className="text-xs font-semibold text-blue-400">
                                        {seasonName}
                                    </span>
                                </div>
                            )}
                        </div>

                        {isLoading ? (
                            <div className="flex text-white justify-center">
                                <LoaderFive text="Loading teams..." />
                            </div>
                        ) : (
                            <div className="rounded-2xl border border-white/10 bg-black/50 backdrop-blur-md shadow-2xl shadow-black/50 overflow-hidden">
                                {/* Table */}
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-zinc-800/80 border-b border-white/10">
                                            <th className="px-2 py-2 text-center text-sm font-semibold text-zinc-300">
                                                Slot No
                                            </th>
                                            {Array.from({ length: maxPlayers }, (_, i) => (
                                                <th key={i} className="px-2 py-2 text-center text-sm font-semibold text-zinc-300">
                                                    Player {i + 1}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {uniqueTeams.map((team, index) => {
                                            const players = team.players?.map((p) =>
                                                getDisplayName(p.displayName, p.name)
                                            ) || [];
                                            const paddedPlayers = [...players, ...Array(maxPlayers - players.length).fill("")];

                                            return (
                                                <tr
                                                    key={team.id || index}
                                                    className={`
                            border-b border-white/5
                            ${index % 2 === 0 ? 'bg-zinc-900/40' : 'bg-zinc-800/30'}
                            hover:bg-zinc-700/40 transition-colors
                          `}
                                                >
                                                    <td className="px-2 py-1.5 text-center text-sm font-medium text-zinc-400">
                                                        {index + 2}
                                                    </td>
                                                    {paddedPlayers.map((playerName, playerIndex) => (
                                                        <td
                                                            key={playerIndex}
                                                            className="px-2 py-1.5 text-center text-sm text-white"
                                                        >
                                                            {playerName}
                                                        </td>
                                                    ))}
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>

                                {/* Footer */}
                                <div className="px-2 py-2 bg-zinc-800/60 border-t border-white/10 text-center">
                                    <span className="text-sm font-semibold text-zinc-300">
                                        Total Players: {totalPlayers}
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Footer Branding */}
                        <div className="mt-6 flex items-center justify-center gap-2 text-zinc-500 text-xs">
                            <div className="h-px w-8 bg-gradient-to-r from-transparent to-orange-500/50" />
                            <span className="font-medium text-zinc-400">Designed by Pixel-Thread</span>
                            <div className="h-px w-8 bg-gradient-to-l from-transparent to-orange-500/50" />
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
