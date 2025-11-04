"use client";

import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { motion } from "framer-motion";

interface CategoryTabsProps {
  activeTab: "ultraNoobs" | "noobs" | "pros" | "ultraPros" | "solo";
  setActiveTab: (
    tab: "ultraNoobs" | "noobs" | "pros" | "ultraPros" | "solo"
  ) => void;
  selectedCounts: {
    ultraNoobs: number;
    noobs: number;
    pros: number;
    ultraPros: number;
    solo: number;
  };
}

export function CategoryTabs({
  activeTab,
  setActiveTab,
  selectedCounts,
}: CategoryTabsProps) {
  const tabs = [
    {
      id: "ultraNoobs" as const,
      label: "Ultra Noob",
      shortLabel: "UN",
      count: selectedCounts.ultraNoobs,
      icon: "🔴",
    },
    {
      id: "noobs" as const,
      label: "Noob",
      shortLabel: "Noob",
      count: selectedCounts.noobs,
      icon: "🟡",
    },
    {
      id: "pros" as const,
      label: "Pro",
      shortLabel: "Pro",
      count: selectedCounts.pros,
      icon: "🟢",
    },
    {
      id: "ultraPros" as const,
      label: "Ultra Pro",
      shortLabel: "UP",
      count: selectedCounts.ultraPros,
      icon: "🟣",
    },
    {
      id: "solo" as const,
      label: "Solo",
      shortLabel: "Solo",
      count: selectedCounts.solo,
      icon: "👤",
    },
  ];

  return (
    <div className="relative" id="category-tabs">
      <div className="relative">
        <div
          className="flex gap-1 sm:gap-2 overflow-x-auto scrollbar-hide scroll-smooth touch-pan-x pb-2"
          style={{ WebkitOverflowScrolling: "touch" }}
          onTouchStart={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
        >
          {tabs.map((tab) => (
            <Button
              key={tab.id}
              variant="ghost"
              className={`relative px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium transition-colors flex items-center whitespace-nowrap flex-shrink-0 ${
                activeTab === tab.id
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
              onClick={() => setActiveTab(tab.id)}
              role="tab"
              aria-selected={activeTab === tab.id}
            >
              <span className="mr-1 text-xs sm:text-sm">{tab.icon}</span>
              <span className="hidden sm:inline truncate">{tab.label}</span>
              <span className="sm:hidden truncate">{tab.shortLabel}</span>
              {tab.count > 0 && (
                <Badge
                  variant="secondary"
                  className="ml-1 sm:ml-2 h-4 sm:h-5 px-1 sm:px-1.5 flex items-center justify-center text-xs min-w-[16px] sm:min-w-[20px]"
                >
                  {tab.count}
                </Badge>
              )}
              {activeTab === tab.id && (
                <motion.div
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                  layoutId="underline"
                  transition={{ duration: 0.2 }}
                />
              )}
            </Button>
          ))}
        </div>
        {/* Scroll indicator for mobile */}
        <div className="absolute right-0 top-0 bottom-2 w-4 bg-gradient-to-l from-background to-transparent pointer-events-none sm:hidden" />
      </div>
    </div>
  );
}
