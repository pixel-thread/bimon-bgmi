"use client";

import { FiBarChart } from "react-icons/fi";
import PollManagement from "@/src/components/admin/PollManagement";

const AdminPollsPage = () => {
  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3 text-slate-800 dark:text-foreground">
              <FiBarChart className="h-8 w-8 text-indigo-600" />
              Admin Dashboard - Polls
            </h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-muted-foreground">
              Manage tournament polls and voting.
            </p>
          </div>
        </header>

        <div className="space-y-6">
          <PollManagement />
        </div>
      </div>
    </div>
  );
};

export default AdminPollsPage;
