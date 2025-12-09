// @ts-nocheck
"use client";

import { Card } from "@/src/components/ui/card";
import { Checkbox } from "@/src/components/ui/checkbox";
import { Badge } from "@/src/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/src/components/ui/tooltip";
import { PlayerT } from "@/src/types/player";
import { TournamentT } from "@/src/types/tournament";

interface PlayerCardProps {
  player: PlayerT;
  isSelected: boolean;
  isDisabled: boolean;
  isSolo: boolean;
  excludedFromDeduction: boolean;
  activeTab: "ultraNoobs" | "noobs" | "pros" | "ultraPros" | "solo";
  tournaments: TournamentT[];
  onSelect: () => void;
  onToggleExclusion: () => void;
}

export function PlayerCard({
  player,
  isSelected,
  isDisabled,
  isSolo,
  excludedFromDeduction,
  activeTab,
  onSelect,
  onToggleExclusion,
}: PlayerCardProps) {
  const getCardClassName = () => {
    let baseClass =
      "flex items-center px-2.5 sm:px-3 py-2.5 sm:py-2 mb-2 sm:mb-3 rounded-lg sm:rounded-xl border transition-all duration-200";

    if (player.isBanned) {
      baseClass += " border-red-300 bg-red-50/80 shadow-sm shadow-red-200/50";
    }

    if (isDisabled) {
      baseClass += " border-muted bg-muted/50 opacity-50 cursor-not-allowed";
    } else {
      baseClass += " cursor-pointer touch-manipulation";

      if (isSelected) {
        baseClass += player.isBanned
          ? " border-red-400 bg-red-100/80 shadow-sm"
          : " border-primary bg-primary/10 shadow-sm";
      } else {
        baseClass += player.isBanned
          ? " border-red-300 bg-red-50/80"
          : " border-muted bg-background";
      }

      baseClass += player.isBanned
        ? " hover:bg-red-100/80"
        : " hover:bg-muted/30";

      baseClass +=
        " active:scale-[0.98] focus-within:ring-2 focus-within:ring-primary";
    }

    return baseClass;
  };

  return (
    <Card
      className={getCardClassName()}
      onClick={isDisabled ? undefined : onSelect}
      tabIndex={isDisabled ? -1 : 0}
      aria-pressed={isSelected}
      aria-disabled={isDisabled}
    >
      <Checkbox
        checked={isSelected}
        disabled={isDisabled}
        onCheckedChange={isDisabled ? undefined : onSelect}
        aria-label={`Select ${player.user.userName}`}
        className="mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5"
      />

      <div className="flex-1 flex flex-col gap-0.5 sm:gap-1 min-w-0">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <span
            className={`font-medium text-sm sm:text-base truncate select-none ${player.isBanned ? "text-red-700" : ""
              }`}
          >
            {player.user.userName}
          </span>

          {player.isBanned && (
            <Badge
              variant="destructive"
              className="text-xs bg-red-600 hover:bg-red-700"
            >
              {/* {(() => { */}
              {/*   const banInfo = calculateRemainingBanDuration( */}
              {/*     player, */}
              {/*     tournaments, */}
              {/*   ); */}
              {/*   return banInfo.isExpired */}
              {/*     ? "BAN EXPIRED" */}
              {/*     : `BANNED (${formatRemainingBanDuration( */}
              {/*         banInfo.remainingDuration || 0, */}
              {/*       )})`; */}
              {/* })()} */}
            </Badge>
          )}

          {activeTab === "solo" && (
            <Badge
              variant="outline"
              className={`text-xs px-1 sm:px-1.5 py-0.5 flex-shrink-0 ${player.category === "ULTRA_NOOB"
                  ? "border-red-300 text-red-700"
                  : player.category === "NOOB"
                    ? "border-yellow-300 text-yellow-700"
                    : player.category === "PRO"
                      ? "border-green-300 text-green-700"
                      : "border-purple-300 text-purple-700"
                }`}
            >
              <span className="hidden sm:inline">
                {player.category === "ULTRA_NOOB"
                  ? "🔴 UN"
                  : player.category === "NOOB"
                    ? "🟡 N "
                    : player.category === "PRO"
                      ? "🟢 P"
                      : "🟣 UP"}
              </span>
              <span className="sm:hidden">
                {player.category === "ULTRA_NOOB"
                  ? "🔴"
                  : player.category === "NOOB"
                    ? "🟡"
                    : player.category === "PRO"
                      ? "🟢"
                      : "🟣"}
              </span>
            </Badge>
          )}

          {isSolo && activeTab !== "solo" && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge
                    variant="secondary"
                    className="text-xs px-1 sm:px-1.5 py-0.5 flex-shrink-0 bg-blue-100 text-blue-700 border-blue-300"
                  >
                    👤 Solo
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    This player is selected as solo. Unselect from Solo tab to
                    enable team selection.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>

        <span
          className={`text-xs font-normal ${typeof player.balance === "number"
              ? player.balance > 0
                ? "text-green-600"
                : player.balance < 0
                  ? "text-red-600"
                  : "text-yellow-600"
              : "text-yellow-600"
            }`}
        >
          {typeof player.balance === "number" ? player.balance : 0} UC
        </span>
      </div>

      {isSelected && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <input
                type="checkbox"
                checked={excludedFromDeduction}
                onChange={(e) => {
                  e.stopPropagation();
                  onToggleExclusion();
                }}
                onClick={(e) => e.stopPropagation()}
                className={`w-5 h-5 ml-2 rounded border-2 transition-colors duration-150 focus:ring-0 focus:outline-none ${excludedFromDeduction
                    ? "border-green-500 bg-green-100"
                    : "border-gray-300 bg-white"
                  } hover:border-green-400 cursor-pointer`}
                aria-label="Exclude from deduction"
              />
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">
                {excludedFromDeduction
                  ? "💰 No deduction for this player"
                  : "💸 Click to exclude from balance deduction"}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </Card>
  );
}
