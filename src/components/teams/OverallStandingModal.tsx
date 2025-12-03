"use client";
import { FiX, FiShare2 } from "react-icons/fi";
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

interface OverallStandingModalProps {
  visible: boolean;
  onClose: () => void;
  backgroundImage?: string;
  tournamentTitle: string;
  maxMatchNumber: number;
}

export default function OverallStandingModal({
  visible,
  onClose,
  backgroundImage = "/images/image.png",
  tournamentTitle,
  maxMatchNumber,
}: OverallStandingModalProps) {
  const { matchId: selectedMatch } = useMatchStore();
  const { tournamentId } = useTournamentStore();
  const { data: teamsStats, isFetching } = useQuery({
    queryKey: ["out standing", selectedMatch],
    queryFn: () =>
      http.get<TeamT[]>(
        `/tournament/${tournamentId}/standing?match=${selectedMatch}`,
      ),
    select: (data) => data.data,
    enabled: !!selectedMatch && visible && !!tournamentId,
  });

  // Render the modal if visible and selectedMatch is not empty.

  const shareImage = async () => {
    const shareButton = document.querySelector(
      ".share-button",
    ) as HTMLButtonElement | null;
    if (shareButton) {
      shareButton.disabled = true;
      shareButton.classList.add("loading");
    }

    const element = document.getElementById(
      "shareable-content",
    ) as HTMLDivElement | null;
    if (!element) return;

    // Dynamically load screenshot.css
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "/screenshot.css"; // Ensure this matches your file location
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

      // --- Auto Copy to Clipboard ---
      if (navigator.clipboard && window.ClipboardItem) {
        canvas.toBlob(async (blob) => {
          if (blob) {
            try {
              await navigator.clipboard.write([
                new window.ClipboardItem({ "image/png": blob }),
              ]);
            } catch (e) {
              console.warn("Could not copy image to clipboard:", e);
            }
          }
        }, "image/png");
      }
      // -----------------------------
    } catch (error) {
      console.error("Screenshot error:", error);
    } finally {
      element.classList.remove("force-desktop");
      if (originalParent) {
        tempContainer.removeChild(element);
        originalParent.appendChild(element);
      }
      document.body.removeChild(tempContainer);
      document.head.removeChild(link); // Remove screenshot.css
      if (shareButton) {
        shareButton.disabled = false;
        shareButton.classList.remove("loading");
      }
    }
  };

  const handleClose = () => {
    console.log("Close button clicked");
    onClose();
  };

  if (!visible) return null;

  return (
    <>
      <style jsx>{`
        .share-button.loading::after {
          content: "";
          position: absolute;
          width: 16px;
          height: 16px;
          border: 2px solid #f97316;
          border-top: 2px solid transparent;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
        }
        @keyframes spin {
          to {
            transform: translate(-50%, -50%) rotate(360deg);
          }
        }
        .share-button.loading {
          pointer-events: none;
          position: relative;
        }
      `}</style>
      <div className="fixed inset-0 flex items-center justify-center z-50">
        <div className="floating-button-group absolute top-4 right-4 z-30 flex gap-2">
          <Button
            onClick={shareImage}
            variant="ghost"
            className="share-button text-white hover:text-orange-500 hover:bg-gray-800/50 bg-gray-900/80 p-2 rounded-full relative"
          >
            <FiShare2 className="h-5 w-5" />
          </Button>
          <Button
            onClick={handleClose}
            variant="ghost"
            className="text-white hover:text-red-500 hover:bg-gray-800/50 bg-gray-900/80 p-2 rounded-full"
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
