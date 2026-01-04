"use client";
import { TournamentLayoutContent } from "@/src/components/tournaments/TournamentLayoutContent";

export default function layout({ children }: { children: React.ReactNode }) {
  return (
    <TournamentLayoutContent>
      {children}
    </TournamentLayoutContent>
  );
}
