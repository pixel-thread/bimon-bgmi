"use client";

import { RotateCcw } from "lucide-react";
import { RevealTab } from "@/src/components/RevealTab";
import ProtectedRoute from "@/src/components/ProtectedRoute";
import AdminNavigation from "@/src/components/AdminNavigation";
import { useConditionalRender } from "@/src/hooks/useConditionalRender";

const AdminWheelPage = () => {
  const { shouldRender } = useConditionalRender();

  return (
    <ProtectedRoute requiredAccess="teams-only">
      <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <header className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-3 text-slate-800 dark:text-foreground">
                <RotateCcw className="h-8 w-8 text-indigo-600" />
                Admin Dashboard - Wheel
              </h1>
              <p className="mt-2 text-sm text-slate-500 dark:text-muted-foreground">
                Manage the prize wheel and selections.
              </p>
            </div>
          </header>

          <AdminNavigation />

          <div className="space-y-6">
            <RevealTab
              hideSelectors={!shouldRender({ requireFullAdmin: true })}
              showSelectorsForSuperAdmin={shouldRender({
                requireFullAdmin: true,
              })}
            />
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default AdminWheelPage;
