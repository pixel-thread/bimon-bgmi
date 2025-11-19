"use client";
import { Button } from "@/src/components/ui/button";
import { Separator } from "@/src/components/ui/separator";
import { SidebarTrigger } from "@/src/components/ui/sidebar";
import { useTheme } from "next-themes";
import { Ternary } from "./common/Ternary";
import { MoonIcon, SunIcon } from "lucide-react";
import { SeasonSelector } from "./SeasonSelector";
import TournamentSelector from "./tournaments/TournamentSelector";
import MatchSelector from "./match/MatchSelector";

export function SiteHeader() {
  const { theme, setTheme } = useTheme();
  const onToggleTheme = () => {
    if (theme === "light") {
      setTheme("dark");
    } else {
      setTheme("light");
    }
  };
  return (
    <header className="group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 px-2 flex h-12 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear">
      <div className="flex justify-evenly items-center w-full">
        <div className="flex  w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mx-2 data-[orientation=vertical]:h-4"
          />
          <h1 className="text-base font-medium">Documents</h1>
        </div>
        <div className="flex items-center gap-2">
          <SeasonSelector />
          <TournamentSelector />
          <MatchSelector />
        </div>
        <div className="flex w-full justify-end items-center">
          <div>
            <Button onClick={onToggleTheme} size={"icon"}>
              <Ternary
                condition={theme === "light"}
                trueComponent={<MoonIcon className="h-4 w-4" />}
                falseComponent={<SunIcon className="h-4 w-4" />}
              />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
