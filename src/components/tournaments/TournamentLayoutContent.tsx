"use client";

import { FiUsers } from "react-icons/fi";
import { ReactNode } from "react";
import TournamentNavigation from "@/src/components/tournaments/TournamentNavigation";

interface TournamentLayoutProps {
  children: ReactNode;
  title: string;
  description: string;
  icon?: React.ElementType;
}

export const TournamentLayoutContent = ({
  children,
  title,
  description,
  icon: Icon = FiUsers,
}: TournamentLayoutProps) => {
  return (
    <div className="bg-background text-foreground pt-4 px-4 md:pt-8 md:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="flex flex-col md:flex-row gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3 text-slate-800 dark:text-foreground">
              <Icon className="h-8 w-8 text-indigo-600" />
              BGMI Tournament - {title}
            </h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-muted-foreground">
              {description}
            </p>
          </div>
        </header>

        <TournamentNavigation />

        <div className="space-y-6 pb-0">{children}</div>
      </div>
    </div>
  );
};
