"use client";

import { FiUsers } from "react-icons/fi";
import { PlayersTab } from "@/src/components/PlayersTab";
import ProtectedRoute from "@/src/components/ProtectedRoute";
import AdminNavigation from "@/src/components/AdminNavigation";
import { useAuth } from "@/src/hooks/useAuth";

const AdminPlayersPage = () => {
  const { role } = useAuth();
  const isTeamsAdmin = role === "teams_admin";

  return (
    <ProtectedRoute requiredAccess="teams-only">
      <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <header className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-3 text-slate-800 dark:text-foreground">
                <FiUsers className="h-8 w-8 text-indigo-600" />
                Admin Dashboard - Players
              </h1>
              <p className="mt-2 text-sm text-slate-500 dark:text-muted-foreground">
                Browse all tournament players and their balances.
              </p>
            </div>
          </header>

          <AdminNavigation />

          <div className="space-y-6">
            <PlayersTab
              readOnly={isTeamsAdmin}
              hideCsvExport={isTeamsAdmin}
              showBalanceSummary={true}
            />
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default AdminPlayersPage;
