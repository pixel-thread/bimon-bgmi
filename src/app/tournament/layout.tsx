"use client";
import { TournamentLayoutContent } from "@/src/components/tournaments/TournamentLayoutContent";

import { usePathname } from "next/navigation";
import { FiAward, FiBarChart } from "react-icons/fi";
import { Gamepad2 } from "lucide-react";

const getLayoutDetails = (path: string) => {
  switch (path) {
    case "/tournament/games":
      return {
        title: "Games",
        description: "Take a break and have some fun with mini games!",
        icon: Gamepad2,
      };
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
