"use client";

import { AdminUserPage } from "@/src/components/admin/users";
import { FiUserCheck } from "react-icons/fi";
// import AdminManagement from "@/src/components/AdminManagement";

const AdminManagementPage = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3 text-slate-800 dark:text-foreground">
              <FiUserCheck className="h-8 w-8 text-indigo-600" />
              Admin Dashboard - Admins
            </h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-muted-foreground">
              Manage admin users and permissions.
            </p>
          </div>
        </header>

        <div className="space-y-6">
          <AdminUserPage />
        </div>
      </div>
    </div>
  );
};

export default AdminManagementPage;
