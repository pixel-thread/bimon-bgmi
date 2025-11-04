"use client";

import { FiAward } from "react-icons/fi";
import { WinnersTab } from "@/src/components/WinnersTab";
import { useAuth } from "@/src/hooks/context/auth/useAuth";

const AdminWinnersPage = () => {
  const { user } = useAuth();
  const role = user?.role;
  const isTeamsAdmin = role === "ADMIN";

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3 text-slate-800 dark:text-foreground">
              <FiAward className="h-8 w-8 text-indigo-600" />
              Admin Dashboard - Winners
            </h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-muted-foreground">
              View tournament winners and results.
            </p>
          </div>
        </header>

        <div className="space-y-6">
          <WinnersTab readOnly={isTeamsAdmin} />
        </div>
      </div>
    </div>
  );
};

export default AdminWinnersPage;
