"use client";
import { FiX, FiCheck } from "react-icons/fi";
import { useState } from "react";
import html2canvas from "html2canvas-pro";
import { Button } from "@/src/components/ui/button";
import { ShareableContent } from "../ShareableContent";
import { useMatchStore } from "@/src/store/match/useMatchStore";
import { TeamT } from "@/src/types/team";
import { useTeamsStats } from "@/src/hooks/team/useTeamsStats";
import TeamStats from "./TeamStats";
import { useQuery } from "@tanstack/react-query";
import http from "@/src/utils/http";
import { useTournamentStore } from "@/src/store/tournament";
import { LoaderFive } from "../ui/loader";
import { Download } from "lucide-react";

interface OverallStandingModalProps {
  visible: boolean;
  onClose: () => void;
  backgroundImage?: string;
  tournamentTitle: string;
  maxMatchNumber: number;
  initialTeams?: TeamT[];
}

export default function OverallStandingModal({
  visible,
  onClose,
  backgroundImage = "/images/image.png",
  tournamentTitle,
  maxMatchNumber,
  initialTeams,
}: OverallStandingModalProps) {
  const { matchId: selectedMatch } = useMatchStore();
  const { tournamentId } = useTournamentStore();
  const [isSharing, setIsSharing] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);

  const { data: teamsStats, isFetching } = useQuery({
    queryKey: ["out standing", tournamentId, selectedMatch],
    queryFn: () =>
      http.get<TeamT[]>(
        `/tournament/${tournamentId}/standing?match=${selectedMatch}`,
      ),
    select: (data) => data.data,
    enabled: !!selectedMatch && visible && !!tournamentId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    placeholderData: initialTeams ? { data: initialTeams, success: true, message: "" } as any : undefined,
  });

  const shareImage = async () => {
    setIsSharing(true);
    setShareSuccess(false);

    const element = document.getElementById(
      "shareable-content",
    ) as HTMLDivElement | null;
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
      width: 1280px;
      height: 720px;
      left: -9999px;
      overflow: hidden;
      background-image: url(${backgroundImage});
      background-size: cover;
      background-position: center;
      background-repeat: no-repeat;
      display: flex;
      align-items: center;
      justify-content: center;
    `;
    document.body.appendChild(tempContainer);

    const originalParent = element.parentNode;
    if (originalParent) originalParent.removeChild(element);
    tempContainer.appendChild(element);

    element.classList.add("force-desktop");

    await new Promise((resolve) => setTimeout(resolve, 2000));

    try {
      const canvas = await html2canvas(element, {
        backgroundColor: null,
        scale: 2,
        useCORS: true,
        width: 1280,
        height: 720,
        scrollX: 0,
        scrollY: 0,
        windowWidth: 1280,
        windowHeight: 720,
        ignoreElements: (el) => el.classList.contains("floating-button-group"),
      });

      const downloadLink = document.createElement("a");
      downloadLink.download = `${tournamentTitle.replace(
        /\s+/g,
        "-",
      )}-standings-match-${selectedMatch}.png`;
      downloadLink.href = canvas.toDataURL("image/png");
      downloadLink.click();

      // Auto Copy to Clipboard
      if (navigator.clipboard && window.ClipboardItem) {
        canvas.toBlob(async (blob) => {
          if (blob) {
            try {
              await navigator.clipboard.write([
                new window.ClipboardItem({ "image/png": blob }),
              ]);
              setShareSuccess(true);
              setTimeout(() => setShareSuccess(false), 2000);
            } catch (e) {
              console.warn("Could not copy image to clipboard:", e);
            }
          }
        }, "image/png");
      }
    } catch (error) {
      console.error("Screenshot error:", error);
    } finally {
      element.classList.remove("force-desktop");
      if (originalParent) {
        tempContainer.removeChild(element);
        originalParent.appendChild(element);
      }
      document.body.removeChild(tempContainer);
      document.head.removeChild(link);
      setIsSharing(false);
    }
  };

  const handleClose = () => {
    onClose();
  };

  if (!visible) return null;

  return (
    <>
      <style jsx>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
        
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
          {/* Download Button */}
          <Button
            onClick={shareImage}
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
              <Download className="h-5 w-5" />
            )}
          </Button>

          {/* Close Button */}
          <Button
            onClick={handleClose}
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

        <ShareableContent
          teams={teamsStats || []}
          backgroundImage={backgroundImage}
          tournamentTitle={tournamentTitle}
          maxMatchNumber={maxMatchNumber}
          isLoading={isFetching}
        />
      </div>
    </>
  );
}
