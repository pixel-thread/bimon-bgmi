// app/admin/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { FiSettings, FiUsers, FiBarChart } from "react-icons/fi";

const AdminPage = () => {
  const router = useRouter();

  useEffect(() => {
    // Redirect to teams page as default
    const timer = setTimeout(() => {
      router.replace("/admin/teams");
    }, 2000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <FiSettings className="h-16 w-16 text-indigo-600 mx-auto mb-6" />
          <h1 className="text-4xl font-bold text-slate-800 dark:text-slate-200 mb-6">
            Admin Dashboard
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Tournament administration and management tools. Redirecting to admin
            panel...
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 text-center">
            <FiUsers className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-2">
              Team Management
            </h3>
            <p className="text-slate-600 dark:text-slate-400 text-sm">
              Manage teams, scores, and tournament data
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 text-center">
            <FiBarChart className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-2">
              Analytics
            </h3>
            <p className="text-slate-600 dark:text-slate-400 text-sm">
              View comprehensive tournament statistics
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 text-center">
            <FiSettings className="h-12 w-12 text-purple-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-2">
              Settings
            </h3>
            <p className="text-slate-600 dark:text-slate-400 text-sm">
              Configure tournament parameters and rules
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
