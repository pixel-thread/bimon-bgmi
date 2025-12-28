"use client";

import { useState } from "react";
import { FiDollarSign } from "react-icons/fi";
import { IncomeManagement } from "@/src/components/admin/income/IncomeManagement";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/src/components/ui/tabs";
import { Building2, Landmark } from "lucide-react";

const AdminIncomePage = () => {
    const [activeTab, setActiveTab] = useState("org");

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

                {/* Page-Level Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2 max-w-xs">
                        <TabsTrigger value="org" className="gap-2">
                            <Building2 className="h-4 w-4" />
                            Org
                        </TabsTrigger>
                        <TabsTrigger value="fund" className="gap-2">
                            <Landmark className="h-4 w-4" />
                            Fund
                        </TabsTrigger>
                    </TabsList>

                    <div className="mt-6">
                        <TabsContent value="org" className="mt-0">
                            <IncomeManagement typeFilter="org" />
                        </TabsContent>
                        <TabsContent value="fund" className="mt-0">
                            <IncomeManagement typeFilter="fund" />
                        </TabsContent>
                    </div>
                </Tabs>
            </div>
        </div>
    );
};

export default AdminIncomePage;
