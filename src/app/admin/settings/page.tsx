"use client";

import { FiSettings } from "react-icons/fi";
import { TournamentSettings } from "@/src/components/tournaments/TournamentSettings";

const AdminSettingsPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="max-w-7xl mx-auto space-y-6 p-4 md:p-8">
        {/* Header */}
        <header className="relative">
          <div className="absolute -top-4 -left-4 w-32 h-32 bg-gradient-to-br from-indigo-500/10 to-transparent rounded-full blur-3xl" />
          <div className="absolute top-0 right-20 w-24 h-24 bg-gradient-to-br from-purple-500/10 to-transparent rounded-full blur-2xl" />

          <div className="relative flex items-center gap-4 p-5 bg-gradient-to-br from-card/90 to-card/50 backdrop-blur-sm border rounded-2xl shadow-lg">
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-br from-indigo-500/40 to-purple-500/40 rounded-xl blur opacity-60" />
              <div className="relative p-3 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl">
                <FiSettings className="h-6 w-6 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Admin Settings
              </h1>
              <p className="text-sm text-muted-foreground">
                Configure tournaments, manage seasons, and upload backgrounds
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
