"use client";

import { Button } from "@/src/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/src/components/ui/tooltip";
import { TEAM_MODES, TeamMode } from "./types";

interface TeamModeSelectorProps {
  teamMode: TeamMode;
  setTeamMode: (mode: TeamMode) => void;
}

export function TeamModeSelector({
  teamMode,
  setTeamMode,
}: TeamModeSelectorProps) {
  return (
    <TooltipProvider>
      <div className="space-y-2">
        <div className="flex rounded-md bg-muted overflow-hidden">
          {TEAM_MODES.map((mode) => (
            <Tooltip key={mode.value}>
              <TooltipTrigger asChild>
                <Button
                  variant={teamMode === mode.value ? "default" : "outline"}
                  className={`flex-1 rounded-none transition-all ${
                    teamMode === mode.value
                      ? "bg-primary text-primary-foreground"
                      : "bg-transparent"
                  }`}
                  onClick={() => setTeamMode(mode.value)}
                  role="radio"
                  aria-checked={teamMode === mode.value}
                  aria-label={`${mode.label} team mode`}
                >
                  <span className="font-medium text-sm">{mode.label}</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>{mode.description}</TooltipContent>
            </Tooltip>
          ))}
        </div>
      </div>
    </TooltipProvider>
  );
}
