"use client";

import { FiSettings } from "react-icons/fi";
import { TournamentSettings } from "@/src/components/tournaments/TournamentSettings";

const AdminSettingsPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto space-y-4 p-3 md:p-6">
        {/* Header */}
        <header>
          <div className="flex items-center gap-3 p-4 bg-card border rounded-lg">
            <div className="p-2 bg-muted rounded-lg">
              <FiSettings className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground">
                Settings
              </h1>
              <p className="text-xs text-muted-foreground">
                Tournaments, gallery & seasons
              </p>
            </div>
          </div>
        </header>

        {/* Tournament Settings Component */}
        <TournamentSettings />
      </div>
    </div>
  );
};

export default AdminSettingsPage;

