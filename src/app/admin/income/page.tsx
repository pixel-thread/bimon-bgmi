"use client";

import { FiDollarSign } from "react-icons/fi";
import { IncomeManagement } from "@/src/components/admin/income/IncomeManagement";

const AdminIncomePage = () => {
    return (
        <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
            <div className="max-w-7xl mx-auto space-y-6">
                <header className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-3 text-slate-800 dark:text-foreground">
                            <FiDollarSign className="h-8 w-8 text-emerald-600" />
                            Income Management
                        </h1>
                        <p className="mt-2 text-sm text-slate-500 dark:text-muted-foreground">
                            Track and manage tournament income and funds.
                        </p>
                    </div>
                </header>

                <div className="space-y-6">
                    <IncomeManagement />
                </div>
            </div>
        </div>
    );
};

export default AdminIncomePage;
