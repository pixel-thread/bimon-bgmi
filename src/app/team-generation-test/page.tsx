"use client";

import { TeamGenerationTester } from "@/src/components/TeamGenerationTester";

export default function TeamGenerationTestPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Team Generation Testing Lab
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Test and compare traditional category-based team generation with the
            new balanced K/D + win rate system using realistic mock data. No
            real data is affected.
          </p>
        </div>

        <TeamGenerationTester />
      </div>
    </div>
  );
}
