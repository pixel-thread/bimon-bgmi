"use client";

import { useAuth } from "@/hooks/useAuth";
import { PlayerAuthGuard } from "@/components/AuthGuard";
import { TournamentLoader } from "@/components/TournamentLoader";
import { ReactNode } from "react";

export default function TournamentLayout({ children }: { children: ReactNode }) {
  const { isLoading } = useAuth();

  // Show loading state while auth is being checked
  if (isLoading) {
    return <TournamentLoader />;
  }

  return (
    <PlayerAuthGuard>
      {children}
    </PlayerAuthGuard>
  );
}