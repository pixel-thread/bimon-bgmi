"use client";
import { TournamentLayoutContent } from "@/src/components/TournamentLayoutContent";
import { Gift } from "lucide-react";

import { usePathname } from "next/navigation";
import { FiAward, FiBarChart } from "react-icons/fi";

const getLayoutDetails = (path: string) => {
  switch (path) {
    case "/tournament/players":
      return {
        title: "Position",
        description: "View all tournament teams and their standings.",
      };
    case "/tournament/vote":
      return {
        title: "Vote",
        description: "Cast your vote for tournament polls.",
        icon: FiBarChart,
      };
    case "/tournament/wheel":
      return {
        title: "Claim",
        description: "Claim your prize if you're a winner!",
        icon: Gift,
      };
    case "/tournament/winners":
      return {
        title: "Winners",
        description: "View tournament winners and results.",
        icon: FiAward,
      };
    default:
      return {
        title: "Positions",
        description: "View all tournament teams and their standings.",
      };
  }
};
export default function layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <TournamentLayoutContent
      title={getLayoutDetails(pathname).title}
      description={getLayoutDetails(pathname).description}
      icon={getLayoutDetails(pathname).icon}
    >
      {children}
    </TournamentLayoutContent>
  );
}
