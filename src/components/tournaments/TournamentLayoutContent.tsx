"use client";

import { ReactNode } from "react";
import TournamentNavigation from "@/src/components/tournaments/TournamentNavigation";

interface TournamentLayoutProps {
  children: ReactNode;
}

export const TournamentLayoutContent = ({
  children,
}: TournamentLayoutProps) => {
  return (
    <div className="bg-background text-foreground pt-4 px-4 md:pt-8 md:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <TournamentNavigation />

        <div className="space-y-6 pb-0">{children}</div>
      </div>
    </div>
  );
};
