"use client";

import { useAuth } from "@/src/hooks/useAuth";
import { PlayerAuthGuard } from "@/src/components/AuthGuard";
import { TournamentLoader } from "@/src/components/TournamentLoader";
import { ReactNode } from "react";

export default function TournamentLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { isLoading } = useAuth();

  // Show loading state while auth is being checked
  if (isLoading) {
    return <TournamentLoader />;
  }

  return <PlayerAuthGuard>{children}</PlayerAuthGuard>;
}

